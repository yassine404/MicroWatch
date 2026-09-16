import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Typography, Card, Select, Spin, Row, Col, Statistic, DatePicker, Button, Radio, Space, Tag, Tooltip,
} from 'antd';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import { getMicroservices } from '../api/microservices';
import { fetchAnomaly, fetchForecast } from '../api/ai';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { MonitoredService } from '../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface SlaRecord {
  id: string;
  serviceName: string;
  timestamp: string;
  availability: number;
  errorRate: number;
  avgResponseTimeMs: number;
}

type ViewMode = 'recent' | 'historical';

interface RawSlaRecord {
  id?: string;
  serviceName?: string;
  service_name?: string;
  timestamp?: string;
  availability?: number | string;
  errorRate?: number | string;
  error_rate?: number | string;
  avgResponseTimeMs?: number | string;
  avg_response_time_ms?: number | string;
}

const mapSlaRecord = (item: RawSlaRecord): SlaRecord => {
  const toNumber = (val: unknown): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  return {
    id: item.id ?? '',
    serviceName: item.serviceName ?? item.service_name ?? '',
    timestamp: item.timestamp ?? '',
    availability: toNumber(item.availability ?? 0),
    errorRate: toNumber(item.errorRate ?? item.error_rate ?? 0),
    avgResponseTimeMs: toNumber(item.avgResponseTimeMs ?? item.avg_response_time_ms ?? 0),
  };
};

const SlaPage = () => {
  const [service, setService] = useState('');
  const [latest, setLatest] = useState<SlaRecord | null>(null);
  const [timeSeries, setTimeSeries] = useState<SlaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('recent');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
    dayjs().subtract(2, 'hour'),
    dayjs(),
  ]);
  const [downloading, setDownloading] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // États IA
  const [anomaly, setAnomaly] = useState<{ isAnomaly: boolean; score: number } | null>(null);
  const [forecast, setForecast] = useState<{ predicted_error_rates: number[]; trend: string; alert: boolean } | null>(null);
  const [iaLoading, setIaLoading] = useState(false);

  // Chargement des données IA
  useEffect(() => {
    if (!service) return;
    const loadIA = async () => {
      setIaLoading(true);
      try {
        const [anom, fore] = await Promise.all([
          fetchAnomaly(service),
          fetchForecast(service, 5.0),
        ]);
        setAnomaly(anom);
        console.log('Forecast reçu:', fore);
        setForecast(fore);
      } catch (err) {
        console.error('Erreur IA', err);
      } finally {
        setIaLoading(false);
      }
    };
    loadIA();
  }, [service]);

  // Chargement des données SLA
  const fetchData = useCallback(async () => {
    if (!service) return;
    const token = localStorage.getItem('token');
    let url: string;

    if (viewMode === 'recent') {
      url = `/api/sla/${service}/recent`;
    } else {
      const from = dateRange
        ? dateRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss')
        : dayjs().subtract(2, 'day').startOf('day').format('YYYY-MM-DDTHH:mm:ss');
      const to = dateRange
        ? dateRange[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss')
        : dayjs().endOf('day').format('YYYY-MM-DDTHH:mm:ss');
      url = `/api/sla/${service}?from=${from}&to=${to}`;
    }

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (response.status === 404) {
        setLatest(null);
        setTimeSeries([]);
        setLastUpdate(new Date());
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawData = await response.json();

      let mappedData: SlaRecord[] = [];
      if (Array.isArray(rawData)) {
        mappedData = rawData.map((item: RawSlaRecord) => mapSlaRecord(item));
      } else if (rawData && typeof rawData === 'object') {
        mappedData = [mapSlaRecord(rawData as RawSlaRecord)];
      }

      // Filtrer par plage de dates (pour les deux modes)
      if (dateRange && dateRange[0] && dateRange[1]) {
        const from = dateRange[0].toDate().getTime();
        const to = dateRange[1].toDate().getTime();
        mappedData = mappedData.filter(item => {
          const ts = new Date(item.timestamp).getTime();
          return ts >= from && ts <= to;
        });
      }

      // Trier par timestamp croissant
      const sorted = [...mappedData].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setTimeSeries(sorted);

      // --- Calcul de la moyenne pour les cartes (même logique pour les deux modes) ---
      if (sorted.length > 0) {
        const sumAvailability = sorted.reduce((acc, cur) => acc + cur.availability, 0);
        const sumErrorRate = sorted.reduce((acc, cur) => acc + cur.errorRate, 0);
        const sumResponseTime = sorted.reduce((acc, cur) => acc + cur.avgResponseTimeMs, 0);
        const count = sorted.length;

        const averageRecord: SlaRecord = {
          id: 'average',
          serviceName: service,
          timestamp: new Date().toISOString(),
          availability: sumAvailability / count,
          errorRate: sumErrorRate / count,
          avgResponseTimeMs: sumResponseTime / count,
        };
        setLatest(averageRecord);
      } else {
        setLatest(null);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('❌ SLA fetch error:', err);
    }
  }, [service, viewMode, dateRange]);

  useEffect(() => {
    getMicroservices().then(res => setServices(res.data.map((s: MonitoredService) => s.name)));
  }, []);

  useEffect(() => {
    if (!service) return;
    let cancelled = false;

    const load = async () => {
      if (!cancelled) setLoading(true);
      await fetchData();
      if (!cancelled) setLoading(false);
    };
    load();

    if (viewMode === 'recent') {
      intervalRef.current = window.setInterval(() => {
        if (!cancelled) {
          fetchData();
        }
      }, 30000);
    }

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [service, viewMode, dateRange, fetchData]);

  const formatTime = (label: unknown): string => {
    if (typeof label === 'string') return new Date(label).toLocaleString();
    return '';
  };

  const handleDownloadReport = async () => {
    if (!service) {
      alert('Veuillez sélectionner un service.');
      return;
    }
    if (!dateRange) {
      alert('Veuillez sélectionner une plage de dates.');
      return;
    }

    setDownloading(true);
    try {
      const from = dateRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss');
      const to = dateRange[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss');
      const token = localStorage.getItem('token');

      const url = `/api/sla/${service}/report?from=${from}&to=${to}`;

      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `sla-${service}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erreur lors du téléchargement du rapport:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>SLA (Service Level Agreement)</Title>
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Select
            placeholder="Choisir un service"
            value={service}
            onChange={setService}
            style={{ width: 200 }}
            options={services.map(s => ({ value: s, label: s }))}
          />
          <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
            <Radio.Button value="recent">Dernières 15 minutes</Radio.Button>
            <Radio.Button value="historical">Historique (48h)</Radio.Button>
          </Radio.Group>
          
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            showTime={viewMode === 'recent'}
            format={viewMode === 'recent' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'}
            style={{ width: 280 }}
          />

          <Button
            type="primary"
            icon={<span>📄</span>}
            loading={downloading}
            onClick={handleDownloadReport}
            disabled={!service}
          >
            Télécharger le rapport PDF
          </Button>
          {lastUpdate && (
            <span style={{ marginLeft: 16, color: '#888', fontSize: 12 }}>
              Dernière mise à jour : {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </Space>
      </Space>

      {loading ? (
        <Spin style={{ marginTop: 24 }} />
      ) : timeSeries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
          Aucune donnée SLA pour cette période.
        </div>
      ) : (
        <>
          <Row gutter={16} style={{ marginTop: 24, marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Disponibilité (moyenne)"
                  value={latest?.availability}
                  precision={1}
                  suffix="%"
                  styles={{ content: { color: (latest?.availability ?? 0) >= 99.9 ? '#3f8600' : '#cf1322' } }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Taux d'erreur (moyen)"
                  value={latest?.errorRate}
                  precision={2}
                  suffix="%"
                  styles={{ content: { color: (latest?.errorRate ?? 0) <= 1.0 ? '#3f8600' : '#cf1322' } }}
                />
                {iaLoading ? (
                  <Spin size="small" style={{ marginTop: 8 }} />
                ) : (
                  <>
                    {anomaly?.isAnomaly && (
                      <Tooltip title={`Score d'anomalie : ${anomaly.score.toFixed(3)}`}>
                        <Tag color="red" style={{ marginTop: 8 }}>⚠️ Anomalie</Tag>
                      </Tooltip>
                    )}
                    {forecast && (
                      <div style={{ marginTop: 4 }}>
                        {forecast.trend === 'up' && <ArrowUpOutlined style={{ color: 'red' }} />}
                        {forecast.trend === 'down' && <ArrowDownOutlined style={{ color: 'green' }} />}
                        {forecast.trend === 'stable' && <span style={{ color: 'gray' }}>—</span>}
                        <span style={{ fontSize: 12, marginLeft: 4, color: '#888' }}>
                          {forecast.trend === 'up' && 'Tendance à la hausse'}
                          {forecast.trend === 'down' && 'Tendance à la baisse'}
                          {forecast.trend === 'stable' && 'Tendance stable'}
                          {forecast.alert && ' ⚠️ (Seuil dépassé)'}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Temps de réponse (moyen)"
                  value={latest?.avgResponseTimeMs}
                  precision={0}
                  suffix="ms"
                  styles={{ content: { color: (latest?.avgResponseTimeMs ?? 0) <= 500 ? '#3f8600' : '#cf1322' } }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Taux d'erreur (prédiction)"
                  value={forecast?.predicted_error_rates?.[0] ?? 'N/A'}
                  precision={2}
                  suffix="%"
                  styles={{ content: { fontSize: 16 } }}
                />
                <div style={{ fontSize: 12, color: '#888' }}>
                  {forecast?.trend === 'up' && <ArrowUpOutlined style={{ color: 'red' }} />}
                  {forecast?.trend === 'down' && <ArrowDownOutlined style={{ color: 'green' }} />}
                  {forecast?.trend === 'stable' && <span>—</span>}
                  <span style={{ marginLeft: 4 }}>Prochaine valeur</span>
                </div>
              </Card>
            </Col>
          </Row>

          <Card>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                <YAxis />
                <RechartsTooltip labelFormatter={formatTime} />
                <Line type="monotone" dataKey="availability" stroke="#228B22" name="Disponibilité (%)" />
                <Line type="monotone" dataKey="errorRate" stroke="#cf1322" name="Taux d'erreur (%)" />
                <Line type="monotone" dataKey="avgResponseTimeMs" stroke="#001aff" name="Temps de réponse (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
};

export default SlaPage;