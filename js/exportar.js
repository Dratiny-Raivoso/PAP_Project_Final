/* ═══════════════════════════════════════════════════════
   LED · js/exportar.js
   Exportar relatórios em Excel e PDF
   Usa SheetJS para Excel e a Print API do browser para PDF
═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   EXPORTAR EXCEL — REQUISIÇÕES
═══════════════════════════════════════════════════════ */
function exportarExcelRequisicoes() {
  if (!todasRequisicoes.length) {
    alert('Não há requisições para exportar.');
    return;
  }

  const dados = todasRequisicoes.map(r => ({
    'Kit':                  r.equipamentoId?.kit        || '—',
    'Equipamento':          r.equipamentoId?.descricao  || '—',
    'Requisitado por':      r.userId?.name              || '—',
    'Email':                r.userId?.email             || '—',
    'Data Requisição':      formatarDataExcel(r.dataRequisicao),
    'Devolução Prevista':   formatarDataExcel(r.dataDevolucaoPrevista),
    'Devolução Real':       r.dataDevolucaoReal ? formatarDataExcel(r.dataDevolucaoReal) : '—',
    'Estado':               traduzirEstado(r.estado),
    'Notas':                r.notas || '',
  }));

  const ws  = XLSX.utils.json_to_sheet(dados);
  const wb  = XLSX.utils.book_new();

  // Largura das colunas
  ws['!cols'] = [
    { wch: 10 }, { wch: 40 }, { wch: 20 }, { wch: 25 },
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Requisições');
  XLSX.writeFile(wb, `LED_Requisicoes_${dataHoje()}.xlsx`);
}


/* ═══════════════════════════════════════════════════════
   EXPORTAR EXCEL — EQUIPAMENTOS
═══════════════════════════════════════════════════════ */
function exportarExcelEquipamentos() {
  if (!todosEquipamentos.length) {
    alert('Não há equipamentos para exportar.');
    return;
  }

  const dados = todosEquipamentos.map(e => ({
    'Código Kit':    e.kit,
    'Descrição':     e.descricao,
    'Categoria':     e.categoriaId?.nome || '—',
    'Quantidade':    e.quantidade,
    'Disponível':    e.quantidadeDisponivel,
    'Estado':        traduzirEstado(e.estado),
    'Marca':         e.marca        || '',
    'Modelo':        e.modelo       || '',
    'Localização':   e.localizacao  || '',
    'Notas':         e.notas        || '',
  }));

  const ws  = XLSX.utils.json_to_sheet(dados);
  const wb  = XLSX.utils.book_new();

  ws['!cols'] = [
    { wch: 12 }, { wch: 45 }, { wch: 18 }, { wch: 10 },
    { wch: 10 }, { wch: 14 }, { wch: 15 }, { wch: 15 },
    { wch: 20 }, { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Equipamentos');
  XLSX.writeFile(wb, `LED_Equipamentos_${dataHoje()}.xlsx`);
}


/* ═══════════════════════════════════════════════════════
   EXPORTAR PDF — RELATÓRIO DE REQUISIÇÕES
═══════════════════════════════════════════════════════ */
function exportarPDFRequisicoes() {
  if (!todasRequisicoes.length) {
    alert('Não há requisições para exportar.');
    return;
  }

  const ativas     = todasRequisicoes.filter(r => r.estado === 'ativa').length;
  const atrasadas  = todasRequisicoes.filter(r => r.estado === 'atrasada').length;
  const devolvidas = todasRequisicoes.filter(r => r.estado === 'devolvida').length;

  const linhas = todasRequisicoes.map(r => {
    const estadoCor = r.estado === 'ativa' ? '#4DB84B' : r.estado === 'atrasada' ? '#E0176E' : '#888';
    return `
      <tr>
        <td><strong>${r.equipamentoId?.kit || '—'}</strong><br><small>${r.equipamentoId?.descricao || ''}</small></td>
        <td>${r.userId?.name || '—'}<br><small>${r.userId?.email || ''}</small></td>
        <td>${formatarDataExcel(r.dataRequisicao)}</td>
        <td>${formatarDataExcel(r.dataDevolucaoPrevista)}</td>
        <td>${r.dataDevolucaoReal ? formatarDataExcel(r.dataDevolucaoReal) : '—'}</td>
        <td style="color:${estadoCor}; font-weight:600;">${traduzirEstado(r.estado)}</td>
      </tr>`;
  }).join('');

  const janela = window.open('', '_blank');
  janela.document.write(`
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <title>LED — Relatório de Requisições</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; color: #1a1a2e; padding: 30px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 16px; border-bottom: 3px solid #E0176E; }
        .header h1 { font-size: 22px; color: #E0176E; }
        .header p { font-size: 12px; color: #666; }
        .stats { display: flex; gap: 20px; margin-bottom: 24px; }
        .stat { background: #f5f5f5; border-radius: 8px; padding: 12px 20px; text-align: center; }
        .stat .val { font-size: 24px; font-weight: 700; }
        .stat .lbl { font-size: 11px; color: #666; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        thead tr { background: #1a1a2e; color: white; }
        th { padding: 10px 12px; text-align: left; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
        tr:nth-child(even) td { background: #fafafa; }
        small { color: #888; font-size: 11px; }
        .footer { margin-top: 24px; font-size: 11px; color: #888; text-align: center; }
        @media print { body { padding: 15px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>🔬 LED — Laboratório de Educação Digital</h1>
          <p>Relatório de Requisições de Equipamentos</p>
        </div>
        <div style="text-align:right;">
          <p style="font-size:13px; font-weight:600;">Data: ${new Date().toLocaleDateString('pt-PT')}</p>
          <p style="font-size:12px; color:#666;">Total: ${todasRequisicoes.length} registos</p>
        </div>
      </div>

      <div class="stats">
        <div class="stat"><div class="val" style="color:#4DB84B">${ativas}</div><div class="lbl">Ativas</div></div>
        <div class="stat"><div class="val" style="color:#E0176E">${atrasadas}</div><div class="lbl">Atrasadas</div></div>
        <div class="stat"><div class="val" style="color:#888">${devolvidas}</div><div class="lbl">Devolvidas</div></div>
        <div class="stat"><div class="val">${todasRequisicoes.length}</div><div class="lbl">Total</div></div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Equipamento</th>
            <th>Requisitado por</th>
            <th>Data Requisição</th>
            <th>Dev. Prevista</th>
            <th>Dev. Real</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>

      <div class="footer">Gerado automaticamente pelo sistema LED em ${new Date().toLocaleString('pt-PT')}</div>
      <script>setTimeout(() => window.print(), 500);<\/script>
    </body>
    </html>
  `);
  janela.document.close();
}


/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function formatarDataExcel(data) {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-PT');
}

function traduzirEstado(estado) {
  return { disponivel: 'Disponível', requisitado: 'Requisitado', em_manutencao: 'Em Manutenção', danificado: 'Danificado', ativa: 'Ativa', devolvida: 'Devolvida', atrasada: 'Atrasada' }[estado] || estado;
}

function dataHoje() {
  return new Date().toISOString().split('T')[0];
}