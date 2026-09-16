import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Typography, Tag } from 'antd';
import { getUsers, createUser, updateUser, deleteUser, approveUser } from '../api/admin';
import type { User } from '../types';

const { Title } = Typography;

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch  {
      // géré
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchUsers();
    })();
  }, []);

  const handleCreateOrUpdate = async (values: Record<string, unknown>) => {
    
      if (editingUser) {
        await updateUser(editingUser.id, {
          email: values.email as string | undefined,
          role: values.role as string | undefined,
        });
        message.success('Utilisateur modifié');
      } else {
        await createUser(
          values.username as string,
          values.email as string,
          values.password as string,
          values.role as string,
        );
        message.success('Utilisateur créé');
      }
      setModalVisible(false);
      form.resetFields();
      fetchUsers();
    
  };

  const handleDelete = async (id: string) => {
      await deleteUser(id);
      message.success('Utilisateur supprimé');
      fetchUsers();
    
  };

  const handleApprove = async (id: string) => {
      await approveUser(id);
      message.success('Utilisateur activé');
      fetchUsers();
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue({ email: user.email, role: user.role });
    } else {
      setEditingUser(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  const columns = [
    { title: 'Nom d\'utilisateur', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Rôle', dataIndex: 'role', key: 'role' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Space>
          <Button size="small" onClick={() => openModal(record)}>Modifier</Button>
          <Popconfirm title="Supprimer cet utilisateur ?" onConfirm={() => handleDelete(record.id)} okText="Oui" cancelText="Non">
            <Button size="small" danger>Supprimer</Button>
          </Popconfirm>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'orange'}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Space>
          {record.status === 'PENDING' && (
            <Button size="small" type="primary" onClick={() => handleApprove(record.id)}>
              Approuver
            </Button>
          )}
          {/* autres boutons Edit/Delete */}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Gestion des utilisateurs</Title>
      <Button type="primary" onClick={() => openModal()} style={{ marginBottom: 16 }}>
        Créer un utilisateur
      </Button>
      <Table dataSource={users} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editingUser ? 'Modifier utilisateur' : 'Créer un utilisateur'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
          {!editingUser && (
            <>
              <Form.Item name="username" label="Nom d'utilisateur" rules={[{ required: true, min: 3 }]}>
                <Input />
              </Form.Item>
              <Form.Item name="password" label="Mot de passe" rules={[{ required: true, min: 6 }]}>
                <Input.Password />
              </Form.Item>
            </>
          )}
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Rôle" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="VIEWER">VIEWER</Select.Option>
              <Select.Option value="ADMIN">ADMIN</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;