import { useEffect, useState } from 'react';
import {
  Table, Button, Space, message, Popconfirm, Modal, Form, Input, Typography,
} from 'antd';
import {
  getMicroservices, createMicroservice, updateMicroservice, deleteMicroservice,
} from '../api/microservices';
import type { MonitoredService } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
const { Title } = Typography;

const MicroservicesPage = () => {
  const [services, setServices] = useState<MonitoredService[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingService, setEditingService] = useState<MonitoredService | null>(null);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { user } = useAuth();
    const canEdit = user?.role === 'ADMIN' || user?.role === 'ADMIN_SUP';

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await getMicroservices();
      setServices(response.data);
    }finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  (async () => {
    await fetchServices();
  })();
  const interval = setInterval(fetchServices, 15000);
  return () => clearInterval(interval);
}, []);

  const handleCreateOrUpdate = async (values: { name: string; metricsUrl: string }) => {
    
      if (editingService) {
        await updateMicroservice(editingService.id, values);
        message.success('Service updated');
      } else {
        await createMicroservice(values.name, values.metricsUrl);
        message.success('Service created');
      }
      setModalVisible(false);
      form.resetFields();
      fetchServices();
   
  };

  const handleDelete = async (id: string) => {
    
      await deleteMicroservice(id);
      message.success('Service deleted');
      fetchServices();
    
  };

  const openModal = (service?: MonitoredService) => {
    if (service) {
      setEditingService(service);
      form.setFieldsValue({
        name: service.name,
        metricsUrl: service.metricsUrl,
      });
    } else {
      setEditingService(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ color: status === 'UP' ? 'green' : 'red' }}>{status}</span>
      ),
    },
    { title: 'Last Checked', dataIndex: 'lastChecked', key: 'lastChecked' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: MonitoredService) => (
        <Space>
            <Button size="small" onClick={() => navigate('/microservices/' + record.id)}>
            Metrics
            </Button>
            <Button size="small" onClick={() => openModal(record)} disabled={!canEdit}>
            Edit
            </Button>
            <Popconfirm
            title="Delete this service?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            disabled={!canEdit}   // empêche le popconfirm de s'ouvrir
            >
            <Button size="small" danger disabled={!canEdit}>
                Delete
            </Button>
            </Popconfirm>
        </Space>
        ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Monitored Microservices</Title>
      <Button
        type="primary"
        onClick={() => openModal()}
        style={{ marginBottom: 16 }}
        disabled={!canEdit}
        >
        Add Microservice
        </Button>
      <Table
        dataSource={services}
        columns={columns}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingService ? 'Edit Microservice' : 'Add Microservice'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
          <Form.Item
            name="name"
            label="Service Name"
            rules={[{ required: true, min: 3 }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="metricsUrl"
            label="Metrics URL"
            rules={[{ required: true }]}
          >
            <Input placeholder="http://localhost:8082/actuator/prometheus" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MicroservicesPage;