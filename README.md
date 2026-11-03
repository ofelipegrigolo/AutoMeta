<<<<<<< HEAD
# autometa

Aplicativo para gestão de consumo e despesas de veículos: abastecimentos, serviços, consumo médio e relatório mensal por veículo.

## Stack

- [Expo](https://expo.dev) SDK 58 com [expo-router](https://docs.expo.dev/router/introduction) (rotas por arquivo) e React Native
- Firebase JS SDK: Authentication (e-mail/senha, sessão persistida com AsyncStorage) e Cloud Firestore
- TypeScript em modo `strict`
- Builds com [EAS](https://docs.expo.dev/eas/)

## Como rodar

```bash
npm install
npx expo start
```

Scripts: `npm run android`, `npm run ios`, `npm run web`, `npm run lint`.

## Estrutura

```
src/
  app/                 Rotas (expo-router)
    _layout.tsx        Raiz: observa a sessão; sem usuário mostra o login, com usuário mostra as abas
    index.tsx          Início: veículos, registros e relatório mensal
    explore.tsx        Perfil e garagem
  components/
    TelaAuth.tsx       Login e cadastro
    autometa-splash.tsx  Splash animada da marca
    app-tabs(.web).tsx Navegação por abas (nativa e web)
  constants/theme.ts   Cores e fontes
  hooks/               useTheme, useColorScheme
firebaseConfig.ts      Inicialização do Firebase (Auth + Firestore)
```

## Modelo de dados (Firestore)

| Coleção    | Documento                | Campos principais                                                                 |
| ---------- | ------------------------ | --------------------------------------------------------------------------------- |
| `usuario`  | ID = `uid` do Auth       | `nome`, `email`, `telefone`, `fotoUrl`                                            |
| `veiculos` | ID automático            | `usuarioId`, `placa`, `modelo`, `consumoMedio`, `combustivelPadrao`, `cambio`     |
| `historico`| ID automático            | `usuarioId`, `veiculoId`, `tipoRegistro`, `litros`, `quilometragem`, `valorTotal` |

Toda leitura é filtrada por `usuarioId == uid`. Mantenha as Security Rules do Firestore restringindo o acesso a `request.auth.uid`.

## Tema

O app está travado em modo claro (`userInterfaceStyle: "light"` no `app.json`), porque as telas usam cores fixas. A paleta escura já existe em `src/constants/theme.ts`; para ativar o modo escuro, migre as telas para `useTheme` e volte o valor para `"automatic"`.

## Antes de publicar

- Trocar `com.seuusuario.autometa` (Android `package` e iOS `bundleIdentifier`) em `app.json` pelo identificador real.
- Revisar as Security Rules do Firestore.
=======
# 🚗 Gestão de Gastos Veiculares

Aplicativo mobile Android desenvolvido para facilitar o controle e o gerenciamento de despesas relacionadas a veículos, permitindo acompanhar gastos, organizar manutenções e ter uma visão mais clara dos custos envolvidos na utilização de um automóvel.

## 📱 Sobre o projeto

O **Gestão de Gastos Veiculares** tem como objetivo centralizar todas as despesas de um veículo em um único lugar, oferecendo uma maneira simples e organizada de registrar, consultar e acompanhar gastos.

Com ele, o usuário poderá registrar abastecimentos, serviços mecânicos, manutenções e outras despesas, mantendo um histórico financeiro do veículo.

## ✨ Funcionalidades

### 💰 Controle de despesas
- Registro de gastos com combustível.
- Cadastro de serviços e manutenções.
- Registro de despesas diversas.
- Histórico completo de movimentações.
- Organização de gastos por categorias.
- Consulta de despesas por período.

### ⛽ Abastecimentos
- Registro de abastecimentos.
- Quantidade de litros abastecidos.
- Valor por litro e valor total.
- Quilometragem no momento do abastecimento.
- Histórico de consumo e abastecimentos.

### 🔧 Manutenção e serviços
- Registro de serviços realizados.
- Controle de manutenções preventivas e corretivas.
- Histórico de reparos.
- Registro de valores gastos com peças e mão de obra.

### 📊 Dashboard e relatórios
- Resumo financeiro do veículo.
- Total de gastos mensais.
- Comparativo de despesas por categoria.
- Acompanhamento da evolução dos custos.
- Visualização do histórico financeiro.

### 🚘 Gerenciamento de veículos
- Cadastro de veículos.
- Informações como marca, modelo, ano e placa.
- Acompanhamento individual das despesas.
- Possibilidade de gerenciar mais de um veículo.

## 🛠️ Tecnologias

As tecnologias utilizadas no desenvolvimento serão documentadas conforme a implementação do projeto.

- **Plataforma:** Android.
- **Linguagem:** A definir.
- **Banco de dados:** A definir.
- **Interface:** A definir.

## 🎯 Objetivo

Desenvolver uma solução mobile intuitiva e eficiente para ajudar proprietários de veículos a entenderem seus custos, acompanharem despesas e tomarem decisões financeiras mais conscientes sobre seus automóveis.

## 📌 Status do projeto

🚧 Em desenvolvimento.

Novas funcionalidades e melhorias serão implementadas continuamente.

---

**Desenvolvido por Felipe Grigolo, Willian e Erik.**
>>>>>>> 1d1d91bb35726394fa5c95c3f0eefe9ae320265f
