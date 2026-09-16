import { useEffect, useState } from 'react';
import { Table, Button, Space, message, Typography } from 'antd';
import { getRoleRequests, approveRequest, rejectRequest } from '../api/admin';
import type { RoleRequest } from '../types';

const { Title } = Typography;

const AdminRequestsPage = () => {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await getRoleRequests();
      setRequests(response.data);
    } catch {
      // erreur gérée par l'intercepteur
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchRequests();
    })();
  }, []);

  const handleApprove = async (id: string) => {
      await approveRequest(id);
      message.success('Demande approuvée');
      fetchRequests();
    
  };

  const handleReject = async (id: string) => {
    
      await rejectRequest(id);
      message.success('Demande rejetée');
      fetchRequests();

  };

  const columns = [
    { title: 'Demandeur', dataIndex: 'username', key: 'username' },
    { title: 'Rôle demandé', dataIndex: 'requestedRole', key: 'requestedRole' },
    { title: 'Statut', dataIndex: 'status', key: 'status' },
    { title: 'Date de demande', dataIndex: 'requestedAt', key: 'requestedAt' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: RoleRequest) => (
        <Space>
          {record.status === 'PENDING' && (
            <>
              <Button type="primary" size="small" onClick={() => handleApprove(record.id)}>Approuver</Button>
              <Button danger size="small" onClick={() => handleReject(record.id)}>Rejeter</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Demandes de rôle</Title>
      <Table dataSource={requests} columns={columns} rowKey="id" loading={loading} />
    </div>
  );
};

export default AdminRequestsPage;