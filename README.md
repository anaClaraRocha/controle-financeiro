# Controle Financeiro

Controle financeiro simples no navegador: registre entradas e saídas, acompanhe o saldo do mês, consulte o histórico de meses anteriores e faça backup em JSON. Feito com HTML, CSS e JavaScript puro, sem dependências para instalar.

## Funcionalidades

- **Entradas e saídas:** cadastro rápido com valor, descrição e forma (Pix, dinheiro ou débito em conta).
- **Resumo do mês:** saldo disponível, total de entradas e saídas, e uma barra com a proporção entre os dois.
- **Edição e exclusão:** ajuste ou remova qualquer movimentação do mês.
- **Fechamento mensal automático:** quando o mês vira, o app arquiva os totais do mês anterior e leva o saldo como "Saldo Inicial" para o novo mês.
- **Histórico de meses anteriores:** tabela com entradas, saídas e saldo de fechamento de cada mês.
- **Backup em JSON:** botões para exportar e importar os dados.
- **Responsivo:** funciona bem no computador e no celular.

## Tecnologias

- HTML5, CSS3 e JavaScript (ES6+), sem frameworks
- [Font Awesome 6](https://fontawesome.com/) para os ícones (via CDN)
- [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (Google Fonts)
- `localStorage` para guardar os dados
