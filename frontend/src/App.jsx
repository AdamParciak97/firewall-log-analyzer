import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts'
import ReactMarkdown from 'react-markdown'

const API_URL = 'http://localhost:8000'
const COLORS = ['#3b82f6', '#ef4444', '#f97316', '#22c55e', '#a855f7', '#eab308', '#06b6d4', '#ec4899']

// ─── STATS CARDS ─────────────────────────────────────────────────────────────
function StatsCards({ stats }) {
  const cards = [
    { label: 'Wszystkich logów', value: stats.total_logs, color: 'bg-blue-900 border-blue-600' },
    { label: 'Unikalne źródła', value: stats.top_sources?.length, color: 'bg-purple-900 border-purple-600' },
    { label: 'Aplikacje', value: stats.top_applications?.length, color: 'bg-green-900 border-green-600' },
    { label: 'Pary stref', value: stats.top_zone_pairs?.length, color: 'bg-orange-900 border-orange-600' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
      {cards.map((c, i) => (
        <div key={i} style={{ border: '1px solid', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center' }} className={c.color}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>{c.value}</div>
          <div style={{ fontSize: '0.875rem', color: '#d1d5db', marginTop: '0.25rem' }}>{c.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── CHARTS ──────────────────────────────────────────────────────────────────
function Charts({ stats }) {
  const appData = stats.top_applications?.slice(0, 8).map(a => ({ name: a.app || 'unknown', value: a.count })) || []
  const zoneData = stats.top_zone_pairs?.slice(0, 6).map(z => ({ name: z.pair, value: z.count })) || []
  const actionData = Object.entries(stats.actions || {}).map(([name, value]) => ({ name, value }))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">📱 Top Aplikacje</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={appData} layout="vertical">
            <XAxis type="number" stroke="#9ca3af" fontSize={11} />
            <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={10} width={80} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">🔀 Pary Stref</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={zoneData} layout="vertical">
            <XAxis type="number" stroke="#9ca3af" fontSize={11} />
            <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={9} width={100} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
            <Bar dataKey="value" fill="#a855f7" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">⚡ Akcje</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={actionData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}>
              {actionData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── TIMELINE CHART ───────────────────────────────────────────────────────────
function TimelineChart({ hours, maxLogs }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    axios.get(`${API_URL}/logs/timeline?hours=${hours}&max_logs=${maxLogs}`)
      .then(r => {
        const formatted = r.data.timeline.map(item => ({
          hour: item.hour.slice(8),
          count: item.count
        }))
        setData(formatted)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [hours, maxLogs])

  if (loading) return <div className="bg-gray-900 rounded-lg p-4 mb-6"><p className="text-gray-500 text-center py-8">Ładowanie timeline...</p></div>

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-6">
      <h3 className="text-white font-semibold mb-4">📈 Ruch w Czasie (per godzina)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} />
          <YAxis stroke="#9ca3af" fontSize={11} />
          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── TOP TALKERS ──────────────────────────────────────────────────────────────
function TopTalkers({ hours, maxLogs }) {
  const [talkers, setTalkers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    axios.get(`${API_URL}/logs/top-talkers?hours=${hours}&max_logs=${maxLogs}`)
      .then(r => setTalkers(r.data.talkers))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [hours, maxLogs])

  const formatBytes = (bytes) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB'
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB'
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return bytes + ' B'
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-6">
      <h3 className="text-white font-semibold mb-4">🏆 Top Talkers — Hosty Generujące Najwięcej Ruchu</h3>
      {loading ? (
        <p className="text-gray-500 text-center py-8">Ładowanie...</p>
      ) : (
        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2 px-3">#</th>
              <th className="text-left py-2 px-3">IP</th>
              <th className="text-right py-2 px-3">Wysłane</th>
              <th className="text-right py-2 px-3">Otrzymane</th>
              <th className="text-right py-2 px-3">Łącznie</th>
              <th className="text-right py-2 px-3">Połączeń</th>
            </tr>
          </thead>
          <tbody>
            {talkers.map((t, i) => (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-800">
                <td className="py-2 px-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${i === 0 ? 'bg-yellow-600' : i === 1 ? 'bg-gray-500' : i === 2 ? 'bg-orange-700' : 'bg-gray-700'} text-white`}>
                    #{i + 1}
                  </span>
                </td>
                <td className="py-2 px-3 font-mono text-blue-400">{t.ip}</td>
                <td className="py-2 px-3 text-right text-green-400">{formatBytes(t.sent_bytes)}</td>
                <td className="py-2 px-3 text-right text-purple-400">{formatBytes(t.received_bytes)}</td>
                <td className="py-2 px-3 text-right font-bold text-white">{formatBytes(t.total_bytes)}</td>
                <td className="py-2 px-3 text-right">
                  <span className="bg-blue-800 text-blue-200 px-2 py-1 rounded text-xs font-bold">{t.connections}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── TOP TABLE ────────────────────────────────────────────────────────────────
function TopTable({ title, data, col1, col2 }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3">{title}</h3>
      <table className="w-full text-sm text-gray-300">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700">
            <th className="text-left py-2 px-2">{col1}</th>
            <th className="text-right py-2 px-2">{col2}</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((item, i) => (
            <tr key={i} className="border-b border-gray-800 hover:bg-gray-800">
              <td className="py-2 px-2 font-mono text-xs">{Object.values(item)[0]}</td>
              <td className="py-2 px-2 text-right">
                <span className="bg-blue-800 text-blue-200 px-2 py-1 rounded text-xs font-bold">{Object.values(item)[1]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── LOGS TABLE ───────────────────────────────────────────────────────────────
function LogsTable({ hours, maxLogs }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ src_ip: '', dst_ip: '', application: '', src_zone: '', dst_zone: '' })

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ hours, max_logs: maxLogs })
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v) })
      const res = await axios.get(`${API_URL}/logs?${params}`)
      setLogs(res.data.logs)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [hours, maxLogs])

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">📋 Logi Ruchu</h3>
      <div className="flex flex-wrap gap-3 mb-4">
        {[['src_ip', 'Źródło IP'], ['dst_ip', 'Cel IP'], ['application', 'Aplikacja'], ['src_zone', 'Strefa src'], ['dst_zone', 'Strefa dst']].map(([key, label]) => (
          <input key={key} type="text" placeholder={`🔍 ${label}`} value={filters[key]}
            onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
            className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-blue-500 w-36" />
        ))}
        <button onClick={fetchLogs} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Filtruj
        </button>
        <span className="text-gray-500 text-sm self-center">Wyników: {logs.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-gray-300">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2 px-2">Czas</th>
              <th className="text-left py-2 px-2">Źródło IP</th>
              <th className="text-left py-2 px-2">Cel IP</th>
              <th className="text-left py-2 px-2">Strefa src</th>
              <th className="text-left py-2 px-2">Strefa dst</th>
              <th className="text-left py-2 px-2">Aplikacja</th>
              <th className="text-left py-2 px-2">Port</th>
              <th className="text-left py-2 px-2">Akcja</th>
              <th className="text-left py-2 px-2">Reguła</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-500">Ładowanie...</td></tr>
            ) : logs.map((log, i) => (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-800">
                <td className="py-1 px-2 font-mono">{log.time?.slice(0, 16)}</td>
                <td className="py-1 px-2 font-mono text-blue-400">{log.src_ip}</td>
                <td className="py-1 px-2 font-mono text-purple-400">{log.dst_ip}</td>
                <td className="py-1 px-2">{log.src_zone}</td>
                <td className="py-1 px-2">{log.dst_zone}</td>
                <td className="py-1 px-2 text-green-400">{log.application}</td>
                <td className="py-1 px-2">{log.dst_port}</td>
                <td className="py-1 px-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.action === 'allow' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
                    {log.action}
                  </span>
                </td>
                <td className="py-1 px-2 text-gray-500 text-xs">{log.rule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── MARKDOWN COMPONENTS ─────────────────────────────────────────────────────
const mdComponents = {
  h1: ({ children }) => <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ color: '#60a5fa', fontSize: '1.25rem', fontWeight: 'bold', margin: '1.5rem 0 0.5rem' }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ color: '#f97316', fontSize: '1.1rem', fontWeight: 'bold', margin: '1rem 0 0.25rem' }}>{children}</h3>,
  strong: ({ children }) => <strong style={{ color: '#fbbf24' }}>{children}</strong>,
  li: ({ children }) => <li style={{ marginLeft: '1.5rem', listStyleType: 'disc', marginBottom: '0.25rem' }}>{children}</li>,
  p: ({ children }) => <p style={{ marginBottom: '0.75rem' }}>{children}</p>,
  hr: () => <hr style={{ borderColor: '#374151', margin: '1rem 0' }} />,
  code: ({ children }) => <code style={{ backgroundColor: '#1f2937', color: '#a78bfa', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85em' }}>{children}</code>,
}

// ─── REPORT VIEW ─────────────────────────────────────────────────────────────
function ReportView({ data }) {
  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const maxWidth = pageWidth - margin * 2
    let y = margin

    pdf.setFillColor(17, 24, 39)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
    pdf.setFontSize(18)
    pdf.setTextColor(255, 255, 255)
    pdf.text('Log Analyzer - Sugestie Regul AI', margin, y)
    y += 8
    pdf.setFontSize(10)
    pdf.setTextColor(156, 163, 175)
    pdf.text(`Data: ${data.timestamp}  |  Logow: ${data.logs_count}  |  Zakres: ${data.time_range}`, margin, y)
    y += 10
    pdf.setDrawColor(59, 130, 246)
    pdf.setLineWidth(0.5)
    pdf.line(margin, y, pageWidth - margin, y)
    y += 8

    for (const line of data.report.split('\n')) {
      if (y > pageHeight - margin) {
        pdf.addPage()
        pdf.setFillColor(17, 24, 39)
        pdf.rect(0, 0, pageWidth, pageHeight, 'F')
        y = margin
      }
      const clean = line.replace(/[#*`]/g, '').trim()
      if (!clean) { y += 4; continue }
      if (line.startsWith('## ')) {
        pdf.setFontSize(13); pdf.setTextColor(96, 165, 250)
        const w = pdf.splitTextToSize(clean, maxWidth)
        pdf.text(w, margin, y); y += w.length * 6 + 2
      } else if (line.startsWith('### ')) {
        pdf.setFontSize(11); pdf.setTextColor(249, 115, 22)
        const w = pdf.splitTextToSize(clean, maxWidth)
        pdf.text(w, margin, y); y += w.length * 5 + 2
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        pdf.setFontSize(9); pdf.setTextColor(209, 213, 219)
        const w = pdf.splitTextToSize('• ' + clean.slice(2), maxWidth - 5)
        pdf.text(w, margin + 3, y); y += w.length * 4.5
      } else {
        pdf.setFontSize(9); pdf.setTextColor(209, 213, 219)
        const w = pdf.splitTextToSize(clean, maxWidth)
        pdf.text(w, margin, y); y += w.length * 4.5
      }
    }
    pdf.save(`log-analysis-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={handleExportPDF}
          className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
          📄 Eksport PDF
        </button>
      </div>
      <div className="bg-gray-900 rounded-lg p-6 text-gray-200 leading-relaxed">
        <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1rem' }}>
          📅 {data.timestamp} &nbsp;|&nbsp; 📋 Logów: {data.logs_count} &nbsp;|&nbsp; ⏱️ {data.time_range}
        </div>
        <ReactMarkdown components={mdComponents}>{data.report}</ReactMarkdown>
      </div>
    </div>
  )
}

// ─── ANOMALY VIEW ─────────────────────────────────────────────────────────────
function AnomalyView({ hours, maxLogs }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const runDetection = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_URL}/anomalies?hours=${hours}&max_logs=${maxLogs}`)
      setData(res.data)
    } catch {}
    setLoading(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-white text-xl font-bold">🚨 Anomaly Detection</h2>
          <p className="text-gray-400 text-sm mt-1">AI wykrywa podejrzane wzorce ruchu: skanowanie portów, beaconing, eksfiltrację danych</p>
        </div>
        <button onClick={runDetection} disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors">
          {loading ? '⏳ Wykrywam anomalie...' : '🔍 Wykryj Anomalie'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p>AI analizuje logi pod kątem anomalii...</p>
          <p className="text-sm mt-2">To może potrwać kilkanaście sekund</p>
        </div>
      )}

      {!loading && data && (
        <div className="bg-gray-900 rounded-lg p-6 text-gray-200 leading-relaxed">
          <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1rem' }}>
            📅 {data.timestamp} &nbsp;|&nbsp; 📋 Przeanalizowano: {data.logs_count} logów
          </div>
          <ReactMarkdown components={mdComponents}>{data.report}</ReactMarkdown>
        </div>
      )}

      {!loading && !data && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">🚨</div>
          <p>Kliknij "Wykryj Anomalie" aby uruchomić analizę</p>
        </div>
      )}
    </div>
  )
}

// ─── XML EXPORT VIEW ──────────────────────────────────────────────────────────
function XmlExportView({ hours, maxLogs }) {
  const [xml, setXml] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateXml = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_URL}/export/xml?hours=${hours}&max_logs=${maxLogs}`, {
        responseType: 'text'
      })
      setXml(res.data)
    } catch {}
    setLoading(false)
  }

  const downloadXml = () => {
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paloalto-rules-${new Date().toISOString().slice(0, 10)}.xml`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyXml = () => {
    navigator.clipboard.writeText(xml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-white text-xl font-bold">📤 Eksport Reguł do XML</h2>
          <p className="text-gray-400 text-sm mt-1">Generuje gotowe reguły PAN-OS XML do importu na firewall Palo Alto</p>
        </div>
        <button onClick={generateXml} disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-900 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors">
          {loading ? '⏳ Generuję XML...' : '⚙️ Generuj XML'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">⚙️</div>
          <p>AI generuje reguły PAN-OS XML...</p>
        </div>
      )}

      {!loading && xml && (
        <div>
          <div className="bg-green-900 border border-green-600 text-green-200 px-4 py-3 rounded-lg mb-4 text-sm">
            ✅ Wygenerowano reguły XML. Możesz je zaimportować przez: <strong>Device → Setup → Operations → Import Named Configuration Snapshot</strong> lub przez Panorama.
          </div>
          <div className="flex gap-3 mb-4">
            <button onClick={downloadXml}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              💾 Pobierz XML
            </button>
            <button onClick={copyXml}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {copied ? '✅ Skopiowano!' : '📋 Kopiuj XML'}
            </button>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">{xml}</pre>
          </div>
        </div>
      )}

      {!loading && !xml && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">📤</div>
          <p>Kliknij "Generuj XML" aby wygenerować reguły gotowe do importu na Palo Alto</p>
        </div>
      )}
    </div>
  )
}

// ─── HISTORY VIEW ────────────────────────────────────────────────────────────
function HistoryView({ history, onLoad, selectedAnalysis }) {
  return (
    <div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-white font-semibold mb-4">📁 Historia Analiz</h3>
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Brak zapisanych analiz. Uruchom pierwszą analizę!</p>
        ) : (
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-3">Data</th>
                <th className="text-left py-2 px-3">Zakres czasu</th>
                <th className="text-left py-2 px-3">Logów</th>
                <th className="text-left py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {history.map(a => (
                <tr key={a.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="py-2 px-3">{a.timestamp}</td>
                  <td className="py-2 px-3">
                    <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs">{a.time_range}</span>
                  </td>
                  <td className="py-2 px-3 font-bold text-white">{a.logs_count}</td>
                  <td className="py-2 px-3">
                    <button onClick={() => onLoad(a.id)}
                      className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">
                      Zobacz raport
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selectedAnalysis && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">📄 Raport z {selectedAnalysis.timestamp}</h3>
          <ReactMarkdown components={mdComponents}>{selectedAnalysis.report}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [stats, setStats] = useState(null)
  const [report, setReport] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedAnalysis, setSelectedAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [hours, setHours] = useState(24)
  const [maxLogs, setMaxLogs] = useState(5000)

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/analyses`)
      setHistory(res.data)
    } catch {}
  }

  const loadAnalysis = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/analyses/${id}`)
      setSelectedAnalysis(res.data)
    } catch {}
  }

  useEffect(() => {
    axios.get(`${API_URL}/logs/stats?hours=${hours}&max_logs=${maxLogs}`)
      .then(r => setStats(r.data))
      .catch(() => setError('Błąd połączenia z API'))
      .finally(() => setLoadingStats(false))
    loadHistory()
  }, [])

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_URL}/analyze?hours=${hours}&max_logs=${maxLogs}`)
      setReport(res.data)
      setStats(res.data.stats)
      setActiveTab('report')
      loadHistory()
    } catch {
      setError('Błąd analizy. Sprawdź czy backend działa.')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'talkers', label: '🏆 Top Talkers' },
    { id: 'logs', label: '📋 Logi' },
    { id: 'anomalies', label: '🚨 Anomalie' },
    { id: 'xml', label: '📤 Eksport XML' },
    { id: 'report', label: '🤖 Sugestie AI' },
    { id: 'history', label: '📁 Historia' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">📡 Log Analyzer</h1>
            <p className="text-gray-400">Analiza ruchu sieciowego Palo Alto + sugestie reguł AI</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
              <span className="text-gray-400 text-sm">⏱️ Zakres:</span>
              <select value={hours} onChange={e => setHours(Number(e.target.value))}
                className="bg-transparent text-white text-sm focus:outline-none">
                <option value={1}>Ostatnia 1h</option>
                <option value={6}>Ostatnie 6h</option>
                <option value={24}>Ostatnie 24h</option>
                <option value={48}>Ostatnie 48h</option>
                <option value={168}>Ostatni tydzień</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
              <span className="text-gray-400 text-sm">📋 Logi:</span>
              <select value={maxLogs} onChange={e => setMaxLogs(Number(e.target.value))}
                className="bg-transparent text-white text-sm focus:outline-none">
                <option value={500}>500</option>
                <option value={1000}>1 000</option>
                <option value={2000}>2 000</option>
                <option value={5000}>5 000</option>
              </select>
            </div>
            <button onClick={runAnalysis} disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors">
              {loading ? '⏳ Analizuję...' : '🔍 Analizuj i Sugeruj Reguły'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-lg mb-6">⚠️ {error}</div>
        )}

        {loading && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🤖</div>
            <p>Pobieranie logów i analiza AI...</p>
            <p className="text-sm mt-2">Przy {maxLogs} logach może potrwać 30-60 sekund</p>
          </div>
        )}

        {!loading && (
          <>
            {activeTab === 'dashboard' && (
              loadingStats ? (
                <div className="text-center py-16 text-gray-500">Ładowanie statystyk...</div>
              ) : stats ? (
                <>
                  <StatsCards stats={stats} />
                  <TimelineChart hours={hours} maxLogs={maxLogs} />
                  <Charts stats={stats} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <TopTable title="🔝 Top Źródła IP" data={stats.top_sources} col1="IP" col2="Połączeń" />
                    <TopTable title="🎯 Top Destynacje IP" data={stats.top_destinations} col1="IP" col2="Połączeń" />
                    <TopTable title="🔌 Top Porty" data={stats.top_ports} col1="Port" col2="Połączeń" />
                  </div>
                </>
              ) : <div className="text-center py-16 text-gray-500">Brak danych</div>
            )}

            {activeTab === 'talkers' && <TopTalkers hours={hours} maxLogs={maxLogs} />}
            {activeTab === 'logs' && <LogsTable hours={hours} maxLogs={maxLogs} />}
            {activeTab === 'anomalies' && <AnomalyView hours={hours} maxLogs={maxLogs} />}
            {activeTab === 'xml' && <XmlExportView hours={hours} maxLogs={maxLogs} />}

            {activeTab === 'report' && report && <ReportView data={report} />}
            {activeTab === 'report' && !report && (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-4">🤖</div>
                <p>Kliknij "Analizuj i Sugeruj Reguły" aby uruchomić analizę AI</p>
              </div>
            )}

            {activeTab === 'history' && (
              <HistoryView history={history} onLoad={loadAnalysis} selectedAnalysis={selectedAnalysis} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
