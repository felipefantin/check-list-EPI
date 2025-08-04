# Aplicativo de Checklist de EPI

Sistema completo para gestão de checklists de Equipamentos de Proteção Individual (EPI) em conformidade com a NR-6.

## 🎯 Objetivos

- Garantir 100% de conformidade com a NR-6
- Registrar digitalmente EPIs danificados
- Funcionamento offline com sincronização automática
- Interface simples e intuitiva para funcionários
- Painel administrativo completo para gestores

## 🏗️ Arquitetura

- **Backend**: Node.js + Express + MongoDB
- **Frontend Web**: React (Painel Administrativo)
- **Mobile**: React Native (App para funcionários)
- **Banco de Dados**: MongoDB

## 🚀 Instalação

### Pré-requisitos

- Node.js (versão 16 ou superior)
- MongoDB
- React Native CLI (para desenvolvimento mobile)

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd aplicativo-checklist-epi
```

### 2. Instale as dependências

```bash
npm run install-all
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Servidor
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/checklist-epi

# JWT
JWT_SECRET=sua-chave-secreta-aqui

# Upload de arquivos
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### 4. Inicie o servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

### 5. Inicie o painel administrativo

```bash
npm run client
```

### 6. Para desenvolvimento mobile

```bash
npm run mobile
```

## 📱 Funcionalidades

### Para Funcionários (App Mobile)

- ✅ Login com matrícula e senha
- ✅ Visualização de checklists diários
- ✅ Execução de checklist item por item
- ✅ Registro de anomalias com foto
- ✅ Assinatura digital
- ✅ Funcionamento offline
- ✅ Sincronização automática

### Para Supervisores (Web)

- ✅ Visualização de checklists da equipe
- ✅ Aprovação de registros
- ✅ Relatórios básicos

### Para Técnicos de Segurança (Web)

- ✅ Cadastro de funcionários
- ✅ Gestão de tipos de EPI
- ✅ Criação de checklists
- ✅ Relatórios completos
- ✅ Exportação de dados

## 🔒 Segurança

- Autenticação JWT
- Criptografia de senhas (bcrypt)
- Validação de dados
- Headers de segurança (Helmet)
- Conformidade com LGPD

## 📊 Estrutura do Banco de Dados

### Coleções MongoDB

- **users**: Funcionários, supervisores e administradores
- **epi_types**: Tipos de EPI cadastrados
- **checklists**: Templates de checklist
- **checklist_executions**: Execuções de checklist
- **anomalies**: Registros de anomalias com fotos

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes de integração
npm run test:integration
```

## 📈 Roadmap

- [x] MVP - Funcionalidades básicas
- [ ] Notificações push
- [ ] Relatórios avançados
- [ ] Integração com sistemas externos
- [ ] Dashboard em tempo real
- [ ] Backup automático

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através dos issues do GitHub. 