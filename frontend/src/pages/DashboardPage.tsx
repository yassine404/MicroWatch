import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, List, Button, Space, Tag, message, Spin, Select, Radio } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  CloudServerOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  PieChartOutlined,
  FileTextOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { getMicroservices } from '../api/microservices';
import { searchLogs } from '../api/logs';
import { requestAdmin } from '../api/auth';
import type { MonitoredService } from '../types';

const { Title, Text } = Typography;

// Type pour les clusters retournés par l'IA
interface ClusterInfo {
  cluster_id: number;
  keywords: string[];
  count: number;
  sample_message: string;
}

// Type pour un log extrait (peut avoir différents champs)
interface ExtractedLog {
  message?: string;
  msg?: string;
  _source?: { message?: string; msg?: string };
  [key: string]: unknown;
}

type ViewMode = 'clusters' | 'raw';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [microservices, setMicroservices] = useState<{ id: string; name: string }[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('clusters');
  const [iaClusters, setIaClusters] = useState<ClusterInfo[]>([]);
  const [clustersLoading, setClustersLoading] = useState(false);
  const [topErrors, setTopErrors] = useState<{ message: string; count: number }[]>([]);
  const [rawLoading, setRawLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Récupérer la liste des microservices
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await getMicroservices();
        const services = res.data.map((s: MonitoredService) => ({ id: s.id, name: s.name }));
        setMicroservices(services);
        if (services.length > 0) {
          setSelectedService(services[0].name);
        }
      } catch (error) {
        console.error('Erreur chargement des services', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Charger les clusters IA
  useEffect(() => {
    if (!selectedService) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIaClusters([]);
      return;
    }
    const fetchClusters = async () => {
      setClustersLoading(true);
      try {
        const response = await fetch(`/api/ia/logs/clusters/${selectedService}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        setIaClusters(data.clusters || []);
      } catch (error) {
        console.error('Erreur clusters IA:', error);
        setIaClusters([]);
      } finally {
        setClustersLoading(false);
      }
    };
    fetchClusters();
  }, [selectedService]);

  // Charger les logs bruts (top 10)
  useEffect(() => {
    if (!selectedService) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTopErrors([]);
      return;
    }
    const fetchRawErrors = async () => {
      setRawLoading(true);
      try {
        const logsRes = await searchLogs({ level: 'ERROR', size: 200, service: selectedService });
        console.log('📝 logsRes brut:', logsRes);

        let extractedLogs: ExtractedLog[] = [];
        const data = logsRes.data;

        // Détection du format de la réponse
        if (Array.isArray(data)) {
          extractedLogs = data;
        } else if (data && Array.isArray(data.content)) {
          extractedLogs = data.content;
        } else if (data && data.hits && Array.isArray(data.hits)) {
          extractedLogs = data.hits.map((h: { _source?: unknown }) => h._source || h);
        } else if (data && data.hits && data.hits.hits && Array.isArray(data.hits.hits)) {
          extractedLogs = data.hits.hits.map((h: { _source?: unknown }) => h._source || h);
        } else if (data && Array.isArray(data.logs)) {
          // Format attendu : { total, logs: [...] }
          extractedLogs = data.logs;
        } else if (data && Array.isArray(data.items)) {
          extractedLogs = data.items;
        } else {
          console.warn('Format de logs non reconnu, contenu brut:', data);
          extractedLogs = [];
        }

        console.log('📊 Logs extraits:', extractedLogs);

        // Compter les occurrences de chaque message
        const countMap: Record<string, number> = {};
        extractedLogs.forEach((log) => {
          const msg = log.message 
                    || log.msg 
                    || log._source?.message 
                    || log._source?.msg 
                    || 'Message inconnu';
          const cleanMsg = String(msg).trim();
          if (cleanMsg) {
            countMap[cleanMsg] = (countMap[cleanMsg] || 0) + 1;
          }
        });

        const sorted = Object.entries(countMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([message, count]) => ({ message, count }));

        setTopErrors(sorted);
      } catch (error) {
        console.error('Erreur logs bruts:', error);
        setTopErrors([]);
      } finally {
        setRawLoading(false);
      }
    };
    fetchRawErrors();
  }, [selectedService]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" description="Chargement du tableau de bord..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 16px' }}>
      <Title level={2} style={{ color: '#228B22' }}>Tableau de Bord</Title>

      {/* Première ligne : cartes statistiques */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Microservices supervisés"
              value={microservices.length}
              prefix={<CloudServerOutlined style={{ color: '#228B22' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Mon Profil"
              value={user?.username}
              prefix={<UserOutlined style={{ color: '#228B22' }} />}
            />
          </Card>
        </Col>
        {user?.role === 'VIEWER' && (
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              onClick={async () => {
                try {
                  await requestAdmin();
                  message.success('Demande envoyée avec succès');
                } catch {
                  message.error('Erreur lors de la demande');
                }
              }}
            >
              <Statistic
                title="Devenir ADMIN"
                value="Demander"
                prefix={<SettingOutlined style={{ color: '#228B22' }} />}
              />
            </Card>
          </Col>
        )}
        {user?.role === 'ADMIN_SUP' && (
          <>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable onClick={() => navigate('/admin/users')}>
                <Statistic
                  title="Utilisateurs"
                  value="Gérer"
                  prefix={<TeamOutlined style={{ color: '#228B22' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable onClick={() => navigate('/admin/requests')}>
                <Statistic
                  title="Demandes de rôle"
                  value="Examiner"
                  prefix={<SettingOutlined style={{ color: '#228B22' }} />}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* Deuxième ligne : liste des microservices et affichage des erreurs (hybride) */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Microservices supervisés" variant="borderless">
            <List
              dataSource={microservices}
              renderItem={(item) => (
                <List.Item>
                  <Button type="link" onClick={() => navigate(`/microservices/${item.id}`)}>
                    {item.name}
                  </Button>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <span>Erreurs</span>
                <Select
                  placeholder="Choisir un service"
                  value={selectedService}
                  onChange={setSelectedService}
                  style={{ width: 150 }}
                  options={microservices.map((s) => ({ value: s.name, label: s.name }))}
                  loading={loading}
                />
                <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} size="small">
                  <Radio.Button value="clusters">IA (clusters)</Radio.Button>
                  <Radio.Button value="raw">Messages bruts</Radio.Button>
                </Radio.Group>
              </Space>
            }
            variant="borderless"
          >
            {viewMode === 'clusters' ? (
              <>
                {clustersLoading ? (
                  <Spin description="Analyse IA en cours..." />
                ) : selectedService && iaClusters.length > 0 ? (
                  <List
                    dataSource={iaClusters}
                    renderItem={(cluster) => (
                      <List.Item>
                        <Space>
                          <Tag color="red">{cluster.count}</Tag>
                          <Text ellipsis={{ tooltip: cluster.sample_message }} style={{ maxWidth: 300 }}>
                            {cluster.keywords.join(', ')}
                          </Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : selectedService ? (
                  <Text type="secondary">Aucune erreur détectée par l’IA pour ce service</Text>
                ) : (
                  <Text type="secondary">Sélectionnez un service</Text>
                )}
              </>
            ) : (
              <>
                {rawLoading ? (
                  <Spin description="Chargement des logs..." />
                ) : topErrors.length > 0 ? (
                  <List
                    dataSource={topErrors}
                    renderItem={(item) => (
                      <List.Item>
                        <Space>
                          <Tag color="orange">{item.count}</Tag>
                          <Text ellipsis={{ tooltip: item.message }} style={{ maxWidth: 300 }}>
                            {item.message}
                          </Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Text type="secondary">Aucune erreur récente pour ce service</Text>
                )}
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* Troisième ligne : boutons de navigation */}
      <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
        <Col span={24}>
          <Card title="Navigation rapide" variant="borderless">
            <Space wrap>
              <Button icon={<CloudServerOutlined />} onClick={() => navigate('/microservices')}>
                Microservices
              </Button>
              <Button icon={<PieChartOutlined />} onClick={() => navigate('/sla')}>
                SLA
              </Button>
              <Button icon={<FileTextOutlined />} onClick={() => navigate('/logs')}>
                Logs
              </Button>
              <Button icon={<UserOutlined />} onClick={() => navigate('/profile')}>
                Profil
              </Button>
              {user?.role === 'ADMIN_SUP' && (
                <Button icon={<SettingOutlined />} onClick={() => navigate('/admin/sla-config')}>
                  Config SLA
                </Button>
              )}
              <Button icon={<LogoutOutlined />} danger onClick={() => { logout(); navigate('/login'); }}>
                Déconnexion
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;