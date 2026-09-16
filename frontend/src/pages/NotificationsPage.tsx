import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Spin, Typography, Radio, App } from 'antd';
import { getUnacknowledgedAlerts, getAllAlerts, acknowledgeAlert, deleteAlert } from '../api/alerts';
import type { Alert } from '../api/alerts';
import { CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

const NotificationsPage = () => {
  const { message } = App.useApp();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'unacknowledged' | 'all'>('unacknowledged');

  const fetchAlerts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté pour voir les notifications.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = filter === 'all'
        ? await getAllAlerts()
        : await getUnacknowledgedAlerts();
      setAlerts(res.data);
    } catch (err: unknown) {
      console.error('Erreur chargement des notifications:', err);
      const errorMessage = err instanceof Error ? err.message : 'Impossible de charger les notifications';
      setError(errorMessage);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert(id);
      message.success('Alerte acquittée');
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '';
      message.error('Erreur lors de l\'acquittement: ' + errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAlert(id);
      message.success('Alerte supprimée');
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '';
      message.error('Erreur lors de la suppression: ' + errorMessage);
    }
  };

  const columns = [
    {
      title: 'Service',
      dataIndex: 'serviceName',
      key: 'serviceName',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => (
        <Tag color={text === 'THRESHOLD' ? 'blue' : 'purple'}>
          {text === 'THRESHOLD' ? 'Seuil' : 'Anomalie IA'}
        </Tag>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Sévérité',
      dataIndex: 'severity',
      key: 'severity',
      render: (text: string) => (
        <Tag color={text === 'CRITICAL' ? 'red' : 'orange'}>{text}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (ts: string) => new Date(ts).toLocaleString(),
    },
    {
      title: 'Statut',
      dataIndex: 'acknowledged',
      key: 'acknowledged',
      render: (ack: boolean) => (ack ? <Tag color="green">Acquittée</Tag> : <Tag color="orange">Non acquittée</Tag>),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Alert) => (
        <Space>
          {!record.acknowledged && (
            <Button icon={<CheckCircleOutlined />} onClick={() => handleAcknowledge(record.id)}>
              Acquitter
            </Button>
          )}
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            Supprimer
          </Button>
        </Space>
      ),
    },
  ];

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Title level={3}>Erreur</Title>
        <p>{error}</p>
        <Button onClick={fetchAlerts}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Notifications</Title>
      <div style={{ marginBottom: 16 }}>
        <Radio.Group value={filter} onChange={(e) => setFilter(e.target.value)}>
          <Radio.Button value="unacknowledged">Non acquittées</Radio.Button>
          <Radio.Button value="all">Toutes les alertes</Radio.Button>
        </Radio.Group>
      </div>
      {loading ? (
        <Spin size="large" description="Chargement..." />
      ) : (
        <Table
          dataSource={alerts}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )}
    </div>
  );
};

export default NotificationsPage;