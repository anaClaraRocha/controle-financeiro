(function () {
    'use strict';

    // ---------- Chaves do localStorage (não alterar: mantêm os dados já existentes) ----------
    const KEY_TRANSACOES = 'stil_finance_final';
    const KEY_HISTORICO = 'stil_finance_historico_mensal';
    const KEY_MES_REF = 'stil_finance_mes_referencia';

    // ---------- Estado ----------
    let transacoes = lerJSON(KEY_TRANSACOES, []);
    let fechamentos = lerJSON(KEY_HISTORICO, []);
    let ultimoMesSalvo = localStorage.getItem(KEY_MES_REF);

    // ---------- Utilitários ----------
    function lerJSON(chave, padrao) {
        try {
            const valor = JSON.parse(localStorage.getItem(chave));
            return Array.isArray(padrao) && !Array.isArray(valor) ? padrao : (valor ?? padrao);
        } catch (e) {
            return padrao;
        }
    }

    const $ = (id) => document.getElementById(id);

    const formatarMoeda = (v) =>
        Number(v).toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });

    const escapeHTML = (s) =>
        String(s ?? '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));

    // Ícone (Font Awesome) para cada forma de pagamento
    function iconeForma(forma) {
        switch (forma) {
            case 'Pix': return 'fa-brands fa-pix';
            case 'Dinheiro': return 'fa-solid fa-money-bill-wave';
            case 'Saldo Acumulado': return 'fa-solid fa-piggy-bank';
            default: return 'fa-solid fa-building-columns';
        }
    }

    function toast(mensagem, tipo = 'ok') {
        const el = document.createElement('div');
        el.className = `toast ${tipo}`;
        const icone = tipo === 'ok' ? 'fa-circle-check' : 'fa-circle-exclamation';
        el.innerHTML = `<i class="fa-solid ${icone}"></i><span>${escapeHTML(mensagem)}</span>`;
        $('toast-area').appendChild(el);
        setTimeout(() => el.remove(), 3200);
    }

    function salvar() {
        localStorage.setItem(KEY_TRANSACOES, JSON.stringify(transacoes));
        localStorage.setItem(KEY_HISTORICO, JSON.stringify(fechamentos));
    }

    // ---------- Virada de mês: arquiva o mês anterior e leva o saldo adiante ----------
    function verificarViradaDeMes() {
        const agora = new Date();
        const referenciaAtual = `${agora.getMonth()}-${agora.getFullYear()}`;

        if (ultimoMesSalvo && ultimoMesSalvo !== referenciaAtual) {
            let ent = 0, sai = 0;
            transacoes.forEach((t) => {
                if (t.tipo === 'entrada') ent += t.valor; else sai += t.valor;
            });
            const saldoFinal = ent - sai;

            const [mes, ano] = ultimoMesSalvo.split('-');
            const labelMes = new Date(ano, mes).toLocaleString('pt-br', { month: 'long', year: 'numeric' });

            fechamentos.push({
                periodo: labelMes.toUpperCase(),
                entradas: ent,
                saidas: sai,
                saldo: saldoFinal
            });

            transacoes = [];

            if (saldoFinal !== 0) {
                transacoes.push({
                    id: Date.now(),
                    tipo: 'entrada',
                    valor: saldoFinal,
                    descricao: `Saldo Inicial (Vindo de ${labelMes})`,
                    forma: 'Saldo Acumulado',
                    data: agora.toLocaleDateString('pt-br')
                });
            }
            salvar();
        }

        ultimoMesSalvo = referenciaAtual;
        localStorage.setItem(KEY_MES_REF, referenciaAtual);
    }

    // ---------- Renderização ----------
    function renderizar() {
        renderizarMovimentacoes();
        renderizarFechamentos();
        salvar();
    }

    function renderizarMovimentacoes() {
        const corpo = $('historico-corpo');
        const ordenadas = transacoes.slice().sort((a, b) => b.id - a.id);
        let ent = 0, sai = 0;

        if (ordenadas.length === 0) {
            corpo.innerHTML = `
                <tr><td colspan="5" class="vazio">
                    <i class="fa-solid fa-inbox"></i>
                    <strong>Nenhuma movimentação neste mês</strong>
                    Use o formulário acima para registrar a primeira.
                </td></tr>`;
        } else {
            corpo.innerHTML = ordenadas.map((t) => {
                const isE = t.tipo === 'entrada';
                if (isE) ent += t.valor; else sai += t.valor;
                return `
                <tr>
                    <td>
                        <div class="desc">
                            <span class="desc-icon ${isE ? 'in' : 'out'}">
                                <i class="fa-solid ${isE ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                            </span>
                            <span>${t.descricao ? escapeHTML(t.descricao) : '<span class="muted">Sem descrição</span>'}</span>
                        </div>
                    </td>
                    <td class="muted num">${escapeHTML(t.data)}</td>
                    <td><span class="forma"><i class="${iconeForma(t.forma)}"></i>${escapeHTML(t.forma)}</span></td>
                    <td class="right num ${isE ? 'valor-in' : 'valor-out'}">${isE ? '+' : '−'} ${formatarMoeda(t.valor)}</td>
                    <td>
                        <div class="actions">
                            <button class="btn-action" data-acao="editar" data-id="${t.id}" title="Editar" aria-label="Editar movimentação">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn-action del" data-acao="excluir" data-id="${t.id}" title="Excluir" aria-label="Excluir movimentação">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        }

        const saldo = ent - sai;
        const saldoEl = $('saldo-total');
        saldoEl.textContent = formatarMoeda(saldo);
        saldoEl.classList.toggle('negativo', saldo < 0);
        $('total-entradas').textContent = formatarMoeda(ent);
        $('total-saidas').textContent = formatarMoeda(sai);

        const total = ent + sai;
        $('barra-in').style.width = total ? `${(ent / total) * 100}%` : '0%';
        $('barra-out').style.width = total ? `${(sai / total) * 100}%` : '0%';

        $('contagem-mov').textContent =
            ordenadas.length === 1 ? '1 registro' : `${ordenadas.length} registros`;
    }

    function renderizarFechamentos() {
        const corpo = $('historico-meses-corpo');

        if (fechamentos.length === 0) {
            corpo.innerHTML = `
                <tr><td colspan="4" class="vazio">
                    <i class="fa-regular fa-calendar-check"></i>
                    <strong>Ainda não há meses fechados</strong>
                    Quando o mês virar, o resumo aparece aqui automaticamente.
                </td></tr>`;
            return;
        }

        corpo.innerHTML = fechamentos.slice().reverse().map((f) => `
            <tr>
                <td class="mes-titulo">${escapeHTML(String(f.periodo).toLowerCase())}</td>
                <td class="right num valor-in">${formatarMoeda(f.entradas)}</td>
                <td class="right num valor-out">${formatarMoeda(f.saidas)}</td>
                <td class="right"><span class="saldo-pill num ${f.saldo >= 0 ? 'pos' : 'neg'}">${formatarMoeda(f.saldo)}</span></td>
            </tr>`).join('');
    }

    // ---------- Formulário ----------
    function definirTipo(tipo) {
        $('tipo-op').value = tipo;
        const isEntrada = tipo === 'entrada';

        $('fields-entrada-pessoa').hidden = !isEntrada;
        $('fields-entrada-forma').hidden = !isEntrada;
        $('fields-saida').hidden = isEntrada;
        $('btn-submit').className = 'btn ' + (isEntrada ? 'btn-in' : 'btn-out');

        document.querySelectorAll('.segmento button').forEach((b) => {
            const ativo = b.dataset.tipo === tipo;
            b.classList.toggle('ativo', ativo);
            b.setAttribute('aria-pressed', ativo);
        });
    }

    function lerFormulario() {
        const tipo = $('tipo-op').value;
        return {
            tipo,
            valor: parseFloat($('valor').value),
            descricao: tipo === 'entrada' ? $('pessoa').value.trim() : $('justificativa').value.trim(),
            forma: tipo === 'entrada' ? $('forma').value : 'Débito em Conta'
        };
    }

    function modoEdicao(ativo) {
        $('form-container').classList.toggle('editando', ativo);
        $('form-title').textContent = ativo ? 'Editando movimentação' : 'Nova movimentação';
        $('form-hint').textContent = ativo ? 'Ajuste os campos e salve' : 'Registre uma entrada ou saída';
        $('form-icon').className = ativo ? 'fa-solid fa-pen' : 'fa-solid fa-pen-to-square';
        $('btn-submit').hidden = ativo;
        $('btn-save').hidden = !ativo;
        $('btn-cancel').hidden = !ativo;
    }

    function limparFormulario(tipo = 'entrada') {
        $('finance-form').reset();
        $('edit-id').value = '';
        definirTipo(tipo);
    }

    function adicionar(e) {
        e.preventDefault();
        const dados = lerFormulario();
        if (isNaN(dados.valor)) return;

        transacoes.push({
            id: Date.now(),
            ...dados,
            data: new Date().toLocaleDateString('pt-br')
        });

        limparFormulario(dados.tipo);
        renderizar();
        toast(dados.tipo === 'entrada' ? 'Entrada adicionada' : 'Saída adicionada');
    }

    function prepararEdicao(id) {
        const t = transacoes.find((x) => x.id === id);
        if (!t) return;

        $('edit-id').value = t.id;
        $('valor').value = t.valor;
        definirTipo(t.tipo);

        if (t.tipo === 'entrada') {
            $('pessoa').value = t.descricao || '';
            $('forma').value = t.forma === 'Dinheiro' ? 'Dinheiro' : 'Pix';
        } else {
            $('justificativa').value = t.descricao || '';
        }

        modoEdicao(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        $('valor').focus({ preventScroll: true });
    }

    function salvarEdicao() {
        const id = parseInt($('edit-id').value, 10);
        const idx = transacoes.findIndex((x) => x.id === id);
        const dados = lerFormulario();

        if (idx === -1) return cancelarEdicao();
        if (isNaN(dados.valor)) {
            $('valor').focus();
            return toast('Informe um valor válido', 'erro');
        }

        Object.assign(transacoes[idx], dados);
        cancelarEdicao();
        renderizar();
        toast('Alterações salvas');
    }

    function cancelarEdicao() {
        limparFormulario();
        modoEdicao(false);
    }

    function excluir(id) {
        if (!confirm('Excluir esta movimentação permanentemente?')) return;
        transacoes = transacoes.filter((t) => t.id !== id);
        renderizar();
        toast('Movimentação excluída');
    }

    // ---------- Backup (exportar / importar) ----------
    function exportar() {
        const backup = {
            app: 'stil-finance',
            versao: 1,
            exportadoEm: new Date().toISOString(),
            transacoes,
            fechamentos,
            mesReferencia: ultimoMesSalvo
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stil-finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast('Backup exportado');
    }

    function importar(arquivo) {
        if (!arquivo) return;
        const leitor = new FileReader();

        leitor.onload = () => {
            try {
                const dados = JSON.parse(leitor.result);
                if (!Array.isArray(dados.transacoes) || !Array.isArray(dados.fechamentos)) {
                    throw new Error('Formato inválido');
                }
                if (!confirm('Importar este backup vai substituir os dados atuais deste navegador. Continuar?')) return;

                transacoes = dados.transacoes;
                fechamentos = dados.fechamentos;
                if (dados.mesReferencia) {
                    ultimoMesSalvo = dados.mesReferencia;
                    localStorage.setItem(KEY_MES_REF, ultimoMesSalvo);
                }
                verificarViradaDeMes();
                renderizar();
                toast('Backup importado');
            } catch (err) {
                toast('Arquivo de backup inválido', 'erro');
            }
        };
        leitor.readAsText(arquivo);
    }

    // ---------- Eventos ----------
    function iniciarEventos() {
        $('finance-form').addEventListener('submit', adicionar);
        $('btn-save').addEventListener('click', salvarEdicao);
        $('btn-cancel').addEventListener('click', cancelarEdicao);

        document.querySelectorAll('.segmento button').forEach((b) => {
            b.addEventListener('click', () => definirTipo(b.dataset.tipo));
        });

        $('historico-corpo').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-acao]');
            if (!btn) return;
            const id = Number(btn.dataset.id);
            if (btn.dataset.acao === 'editar') prepararEdicao(id);
            if (btn.dataset.acao === 'excluir') excluir(id);
        });

        $('btn-exportar').addEventListener('click', exportar);
        $('btn-importar').addEventListener('click', () => $('arquivo-importar').click());
        $('arquivo-importar').addEventListener('change', (e) => {
            importar(e.target.files[0]);
            e.target.value = '';
        });
    }

    // ---------- Inicialização ----------
    function iniciar() {
        $('periodo-atual').querySelector('span').textContent =
            new Date().toLocaleString('pt-br', { month: 'long', year: 'numeric' });

        verificarViradaDeMes();
        iniciarEventos();
        definirTipo('entrada');
        renderizar();
    }

    iniciar();
})();
