import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Card,
  Select,
  Spin,
  Row,
  Col,
  Statistic,
  DatePicker,
  Button,
} from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getMetricTimeSeries, getLatestMetrics } from '../api/metrics';
import { getMicroservices } from '../api/microservices';
import type { MonitoredService, MetricPoint } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Métriques principales à afficher en priorité
const MAIN_METRICS = [
  'http_server_requests_seconds_count',   // Taux de requêtes
  'http_server_requests_seconds_sum',     // Latence (cumul)
  'process_cpu_usage',                    // CPU
  'jvm_memory_used_bytes',                // Mémoire
];

const MicroserviceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<MonitoredService | null>(null);
  const [metric, setMetric] = useState('');
  const [timeSeriesData, setTimeSeriesData] = useState<MetricPoint[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([
    dayjs().subtract(24, 'hour'),
    dayjs(),
  ]);

  // 1. Charger les informations du service
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await getMicroservices();
        const svc = res.data.find((s) => s.id === id);
        if (svc) setService(svc);
      } catch {
        // ignore
      }
    })();
  }, [id]);

  // 2. Charger les dernières métriques pour les jauges et la liste déroulante
  useEffect(() => {
    if (!service) return;
    (async () => {
      try {
        const res = await getLatestMetrics(service.name);
        setLatestMetrics(res.data);
        // Sélectionner automatiquement la première métrique disponible
        if (!metric) {
          const keys = Object.keys(res.data);
          if (keys.length > 0) setMetric(keys[0]);
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  // 3. Charger la série temporelle quand la métrique ou la plage de dates change
  useEffect(() => {
    if (!service || !metric || !dateRange) return;
    const [start, end] = dateRange;
    if (!start || !end) return;
    const from = start.toISOString();
    const to = end.toISOString();
    (async () => {
      setLoading(true);
      try {
        const res = await getMetricTimeSeries(service.name, metric, from, to);
        const sorted = [...res.data].sort(
          (a, b) =>
            new Date(a['@timestamp']).getTime() -
            new Date(b['@timestamp']).getTime()
        );
        setTimeSeriesData(sorted);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [service, metric, dateRange]);

  // 4. Rafraîchir périodiquement les dernières métriques (pour les jauges)
  useEffect(() => {
    if (!service) return;
    const interval = setInterval(() => {
      getLatestMetrics(service.name)
        .then((res) => setLatestMetrics(res.data))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [service]);

  // Filtrer les métriques pour n'afficher que les principales d'abord
  const allMetricKeys = Object.keys(latestMetrics);
  const mainKeys = allMetricKeys.filter((k) => MAIN_METRICS.includes(k));
  const otherKeys = allMetricKeys.filter((k) => !MAIN_METRICS.includes(k));
  const visibleKeys = showAllMetrics ? [...mainKeys, ...otherKeys] : mainKeys;

  // Générer les options du Select à partir de toutes les métriques
  const metricOptions = allMetricKeys.map((key) => ({
    value: key,
    label: key.replace(/_/g, ' '),
  }));

  const formatTime = (label: unknown): string => {
    if (typeof label === 'string') {
      return new Date(label).toLocaleTimeString();
    }
    return '';
  };

  if (!service) return <div style={{ padding: 24 }}>Chargement...</div>;

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>{service.name} - Métriques</Title>
      <Text type="secondary">Statut : {service.status}</Text>

      {/* Bouton pour basculer l'affichage des métriques */}
      {otherKeys.length > 0 && (
        <Button
          onClick={() => setShowAllMetrics(!showAllMetrics)}
          style={{ marginTop: 16, marginBottom: 16 }}
        >
          {showAllMetrics ? 'Masquer les métriques supplémentaires' : 'Afficher toutes les métriques'}
        </Button>
      )}

      {/* Jauges des dernières valeurs */}
      <Row gutter={[16, 16]} style={{ marginTop: 16, marginBottom: 24 }}>
        {visibleKeys.length > 0 ? (
          visibleKeys.map((key) => (
            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={key}>
              <Card
                hoverable
                size="small"
                title={
                  <div
                    style={{
                      maxWidth: 150,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Typography.Text ellipsis={{ tooltip: key }} style={{ fontSize: 12 }}>
                      {key.replace(/_/g, ' ')}
                    </Typography.Text>
                  </div>
                }
              >
                <Statistic
                  value={latestMetrics[key]}
                  precision={2}
                  styles={{ content: { fontSize: 18 } }}
                />
              </Card>
            </Col>
          ))
        ) : (
          <Col span={24}>
            <Text type="secondary">Aucune métrique disponible</Text>
          </Col>
        )}
      </Row>

      {/* Sélecteur de métrique et graphique */}
      <Card>
        <Select
          value={metric}
          onChange={setMetric}
          style={{ width: 300, marginBottom: 16 }}
          showSearch
          placeholder="Choisir une métrique"
          options={metricOptions}
        />

        <RangePicker
          showTime
          value={dateRange}
          onChange={(dates) => setDateRange(dates ? [dates[0], dates[1]] : null)}
          style={{ marginBottom: 16 }}
        />

        {loading ? (
          <Spin />
        ) : (
          <div style={{ backgroundColor: '#fff', padding: 16, borderRadius: 8 }}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis
                  dataKey="@timestamp"
                  tickFormatter={formatTime}
                  interval="preserveStartEnd"
                  stroke="#000"
                />
                <YAxis stroke="#000" />
                <Tooltip labelFormatter={(label: unknown) => formatTime(label)} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#228B22"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MicroserviceDetailPage;