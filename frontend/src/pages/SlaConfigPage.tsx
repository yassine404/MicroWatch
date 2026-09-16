import { useEffect, useState } from 'react';
import { Typography, Table, Button, Modal, Form, InputNumber, Select, Space, message, Popconfirm } from 'antd';
import { getSlaConfigs, createSlaConfig, updateSlaConfig, deleteSlaConfig } from '../api/SlaConfig';
import type { SlaConfig } from '../api/SlaConfig';
import { getMicroservices } from '../api/microservices';
import type { MonitoredService } from '../types';

const { Title } = Typography;

const SlaConfigPage = () => {
  const [configs, setConfigs] = useState<SlaConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SlaConfig | null>(null);
  const [form] = Form.useForm();
  const [services, setServices] = useState<string[]>([]);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await getSlaConfigs();
      setConfigs(res.data);
    } catch {
      message.error('Erreur lors du chargement des configurations SLA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchConfigs();
    })();
    getMicroservices().then(res => setServices(res.data.map((s: MonitoredService) => s.name)));
  }, []);

  const handleCreateOrUpdate = async (values: SlaConfig) => {
    try {
      if (editingConfig) {
        await updateSlaConfig(editingConfig.id!, values);
        message.success('Configuration SLA modifiée');
      } else {
        await createSlaConfig(values);
        message.success('Configuration SLA créée');
      }
      setModalVisible(false);
      form.resetFields();
      fetchConfigs();
    } catch {
      message.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSlaConfig(id);
      message.success('Configuration SLA supprimée');
      fetchConfigs();
    } catch {
      message.error('Erreur lors de la suppression');
    }
  };

  const openModal = (config?: SlaConfig) => {
    if (config) {
      setEditingConfig(config);
      form.setFieldsValue(config);
    } else {
      setEditingConfig(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  const columns = [
    { title: 'Service', dataIndex: 'serviceName', key: 'serviceName' },
    { title: 'Disponibilité min. (%)', dataIndex: 'availabilityThreshold', key: 'availabilityThreshold' },
    { title: 'Taux d\'erreur max. (%)', dataIndex: 'errorRateThreshold', key: 'errorRateThreshold' },
    { title: 'Temps de réponse max. (ms)', dataIndex: 'responseTimeThresholdMs', key: 'responseTimeThresholdMs' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: SlaConfig) => (
        <Space>
          <Button size="small" onClick={() => openModal(record)}>Modifier</Button>
          <Popconfirm title="Supprimer cette configuration ?" onConfirm={() => handleDelete(record.id!)} okText="Oui" cancelText="Non">
            <Button size="small" danger>Supprimer</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Configurations SLA</Title>
      <Button type="primary" onClick={() => openModal()} style={{ marginBottom: 16 }}>
        Ajouter une configuration
      </Button>
      <Table dataSource={configs} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editingConfig ? 'Modifier la configuration SLA' : 'Nouvelle configuration SLA'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
          <Form.Item
            name="serviceName"
            label="Service"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Sélectionner un service"
              options={services.map(s => ({ value: s, label: s }))}
              disabled={!!editingConfig}
            />
          </Form.Item>
          <Form.Item name="availabilityThreshold" label="Disponibilité minimale (%)" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="errorRateThreshold" label="Taux d'erreur maximal (%)" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="responseTimeThresholdMs" label="Temps de réponse maximal (ms)" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SlaConfigPage;