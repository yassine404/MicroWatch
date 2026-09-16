import { useEffect, useState } from 'react';
import { Typography, Table, Select, Input, DatePicker, Row, Col, Button } from 'antd';
import { searchLogs } from '../api/logs';
import { getMicroservices } from '../api/microservices';
import type { MonitoredService } from '../types';
import dayjs from 'dayjs';
import { InputNumber } from 'antd';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const PAGE_SIZE = 50;

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState('');
  const [level, setLevel] = useState('');
  const [keyword, setKeyword] = useState('');
  const [total, setTotal] = useState(0);
  const [goToPage, setGoToPage] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([
    dayjs().subtract(24, 'hour'),
    dayjs(),
  ]);
  const [services, setServices] = useState<string[]>([]);

  useEffect(() => {
    getMicroservices().then(res => setServices(res.data.map((s: MonitoredService) => s.name)));
  }, []);

  const fetchLogs = async (pageNumber = 0) => {
    setLoading(true);
    setLogs([]);
    try {
      const res = await searchLogs({
        service: service || undefined,
        level: level || undefined,
        keyword: keyword || undefined,
        from: dateRange?.[0]?.toISOString(),
        to: dateRange?.[1]?.toISOString(),
        page: pageNumber,
        size: PAGE_SIZE,
      });
      const data = res.data;
      setLogs(data.logs);
      setTotal(data.total);
      setPage(pageNumber);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchLogs(0);
  };

  const handlePrevPage = () => {
    if (page > 0) fetchLogs(page - 1);
  };

  const handleNextPage = () => {
    if ((page + 1) * PAGE_SIZE < total) fetchLogs(page + 1);
  };

  const columns = [
    { title: 'Timestamp', dataIndex: '@timestamp', key: '@timestamp', width: 180 },
    { title: 'Service', dataIndex: 'service', key: 'service', width: 150 },
    {
      title: 'Level', dataIndex: 'level', key: 'level', width: 80,
      render: (lvl: string) => {
        const color = lvl === 'ERROR' ? 'red' : lvl === 'WARN' ? 'orange' : lvl === 'INFO' ? 'green' : 'blue';
        return <span style={{ color }}>{lvl}</span>;
      },
    },
    { title: 'Message', dataIndex: 'message', key: 'message' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Logs</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col>
          <Select
            allowClear
            placeholder="Service"
            value={service}
            onChange={setService}
            style={{ width: 200 }}
            options={[
              ...services.map(s => ({ value: s, label: s })),
            ]}
          />
        </Col>
        <Col>
          <Select
            allowClear
            placeholder="Level"
            value={level}
            onChange={setLevel}
            style={{ width: 120 }}
            options={['INFO','WARN','ERROR','DEBUG','TRACE'].map(l => ({ value: l, label: l }))}
          />
        </Col>
        <Col>
          <Input.Search
            placeholder="Keyword"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            style={{ width: 200 }}
          />
        </Col>
        <Col>
          <RangePicker
            showTime
            value={dateRange}
            onChange={(dates) => setDateRange(dates ? [dates[0], dates[1]] : null)}
          />
        </Col>
        <Col>
          <Button type="primary" onClick={handleSearch} loading={loading}>
            Search
          </Button>
        </Col>
      </Row>
      <Table dataSource={logs} columns={columns} loading={loading} rowKey="_id" />
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button onClick={handlePrevPage} disabled={page === 0}>Previous</Button>
        <span>Page {page + 1} / {Math.ceil(total / PAGE_SIZE)} (Total: {total})</span>
        <Button onClick={handleNextPage} disabled={(page + 1) * PAGE_SIZE >= total}>Next</Button>

        <span>Aller à la page :</span>
        <InputNumber
          min={1}
          max={Math.ceil(total / PAGE_SIZE)}
          value={goToPage}
          onChange={(val) => setGoToPage(val)}
          style={{ width: 80 }}
        />
        <Button
          onClick={() => {
            if (goToPage && goToPage >= 1 && goToPage <= Math.ceil(total / PAGE_SIZE)) {
              fetchLogs(goToPage - 1);
            }
          }}
        >
          Go
        </Button>
      </div>
    </div>
  );
};

export default LogsPage;