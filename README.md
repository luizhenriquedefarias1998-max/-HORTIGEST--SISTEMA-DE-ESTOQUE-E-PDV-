# 🌿 HortiGest

O **HortiGest** é um sistema completo de gestão de hortifrúti desenvolvido para automatizar o processo de vendas (PDV), controle de estoque em tempo real e a etapa de separação de pedidos com geração automática de documentos em PDF.

---

## 🚀 Tecnologias Utilizadas

### Front-end
* **React.js** (com Vite para uma inicialização ultrarrápida)
* **Tailwind CSS** (para um design moderno, responsivo e intuitivo)
* **Lucide React** (pacote de ícones integrados)

### Back-end
* **Node.js** com **Express**
* **MySQL** (banco de dados relacional)
* **PDFKit** (geração nativa de relatórios de separação em PDF)
* **CORS** & **Dotenv** (segurança e gerenciamento de variáveis de ambiente)

---

## 📁 Estrutura de Pastas do Projeto

O projeto foi estruturado seguindo o modelo de separação de responsabilidades (Client/Server):

```text
hortigest-app/
├── bd/
│   └── estrutura.sql       # Script de backup e consulta da estrutura do banco
├── backend/
│   ├── .env                # Configurações de portas e credenciais do MySQL
│   ├── package.json        # Dependências e scripts do servidor Node
│   └── server.js           # Código principal da API com banco auto-executável
└── frontend/
    ├── src/
    │   ├── App.jsx         # Painel principal (PDV, Estoque e Separação)
    │   ├── index.css       # Estilizações globais e Tailwind CSS
    │   └── main.jsx        # Ponto de entrada do React
    ├── package.json        # Dependências do front-end
    └── vite.config.js      # Configurações do empacotador Vite
🛠️ Configuração Inicial
1. Pré-requisitos
Antes de começar, certifique-se de ter instalado em sua máquina:

Node.js

MySQL (ou um servidor local como XAMPP / WampServer)

2. Configurando as Variáveis de Ambiente
Dentro da pasta backend/, crie ou edite o arquivo .env e configure as credenciais do seu banco de dados local:

Snippet de código
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=hortigest
PORT=3001
Nota: Se você utiliza o XAMPP, por padrão o campo DB_PASSWORD deve ser deixado totalmente vazio.

🏃‍♂️ Como Rodar a Aplicação
O sistema precisa que o Back-end e o Front-end rodem simultaneamente em dois terminais diferentes.

Passo 1: Inicializar o Back-end (API)
Abra o terminal na raiz do projeto e execute os seguintes comandos:

Bash
cd backend
npm install
npm run dev
Mágica do Sistema: O back-end foi programado para verificar o seu MySQL automaticamente. Ele criará o banco de dados hortigest, estruturará as tabelas de produtos/pedidos e populará a lista inicial de hortifrútis caso o banco esteja vazio.

Passo 2: Inicializar o Front-end (Interface)
Abra um segundo terminal no seu editor de código e execute:

Bash
cd frontend
npm install
npm run dev
Passo 3: Acessar o Sistema
Assim que os comandos acima terminarem, abra o seu navegador de preferência e acesse o endereço local fornecido pelo Vite:
👉 http://localhost:5173

💡 Funcionalidades Principais do Painel
PDV (Frente de Caixa): Permite buscar produtos por nome ou código, montar o carrinho com cálculo automático do total e fechar vendas salvando diretamente no banco.

Estoque Inteligente: Listagem visual de todos os produtos com atualização e baixa de quantidade automatizada após cada venda concluída.

Separação de Pedidos: Aba dedicada para conferência de pedidos pendentes, permitindo alterar o status da entrega e gerar um documento PDF de Separação limpo para impressão.

Desenvolvido com 💚 para facilitar a gestão de negócios de hortifrúti.
