# SID - Sistema de Inteligência de Dados para SST - TODO

## Banco de Dados
- [x] Criar tabelas: users, roles, permissions
- [x] Criar tabelas: accidents, diseases, trainings, inspections, ppps, investigations, campaigns
- [x] Criar tabelas: audit_logs, change_tracking
- [x] Criar tabelas: certificates, documents, attachments
- [x] Configurar relacionamentos e constraints
- [x] Executar migrações com Drizzle ORM

## Backend API
- [ ] Implementar autenticação JWT
- [ ] Implementar controle de permissões (admin, supervisor, operacional)
- [ ] Criar rotas CRUD para acidentes
- [ ] Criar rotas CRUD para doenças ocupacionais
- [ ] Criar rotas CRUD para treinamentos
- [ ] Criar rotas CRUD para inspeções
- [ ] Criar rotas CRUD para PPPs
- [ ] Criar rotas CRUD para investigações
- [ ] Criar rotas CRUD para campanhas
- [ ] Implementar geração de PDFs (PPP, relatórios, atestados)
- [ ] Implementar sistema de auditoria e rastreamento
- [ ] Integrar Claude API para análise de dados
- [ ] Criar endpoints para dashboard (KPIs, gráficos)
- [ ] Implementar testes unitários e de integração

## Frontend
- [ ] Configurar tema visual (cores, tipografia, componentes)
- [ ] Criar layout principal (sidebar, header, footer)
- [ ] Implementar tela de login
- [ ] Implementar dashboard com KPIs e gráficos
- [ ] Criar módulo de acidentes (listagem, criação, edição, detalhes)
- [ ] Criar módulo de doenças (listagem, criação, edição, detalhes)
- [ ] Criar módulo de treinamentos (listagem, criação, edição, certificados)
- [ ] Criar módulo de inspeções (listagem, criação, edição, templates)
- [ ] Criar módulo de PPPs (listagem, geração automática)
- [ ] Criar módulo de investigações (listagem, criação, edição)
- [ ] Criar módulo de campanhas (listagem, criação, edição)
- [ ] Criar módulo de auditoria (visualização de logs)
- [ ] Implementar chat com IA para consultas sobre SST
- [ ] Implementar exportação de dados (Excel, PDF)
- [ ] Implementar gerenciamento de usuários (admin)
- [ ] Implementar perfil de usuário e alteração de senha

## Integração e Testes
- [ ] Conectar frontend com backend
- [ ] Testar fluxos de autenticação
- [ ] Testar CRUD de todas as entidades
- [ ] Testar geração de PDFs
- [ ] Testar integração com IA
- [ ] Testar sistema de auditoria
- [ ] Otimizar performance (lazy loading, caching)
- [ ] Testes de responsividade em diferentes dispositivos

## Deploy
- [ ] Configurar variáveis de ambiente
- [ ] Preparar para produção
- [ ] Criar checkpoint final
- [ ] Entregar plataforma ao usuário
