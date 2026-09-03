# 📖 Memórias Invisíveis

<img width="1000" height="500" alt="Memórias Invisíveis — preservando histórias antes que se apaguem" src="https://github.com/user-attachments/assets/e219846a-6925-4863-b494-dec6e8e9196c" />

## Preservando Histórias Antes que se Apaguem

![HTML5](https://img.shields.io/badge/HTML5-Frontend-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Responsive-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![LocalStorage](https://img.shields.io/badge/LocalStorage-Persistência-4285F4?logo=googlechrome&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white)
![Product Thinking](https://img.shields.io/badge/Product-Thinking-7952B3)
![Status](https://img.shields.io/badge/Status-MVP%20Funcional-success)

---

## 🌐 Demo Online

O MVP está publicado e pode ser experimentado diretamente no navegador:

### 👉 [Acessar Memórias Invisíveis](https://memorias-invisiveis.vercel.app/)

> As memórias registradas nesta versão são armazenadas localmente no navegador utilizado. Nenhuma história é enviada para um servidor.

---

## 🌟 Sobre o Projeto

**Memórias Invisíveis** é um produto digital experimental criado para explorar como tecnologia, storytelling e experiência do usuário podem ajudar famílias a registrar, organizar e preservar histórias que muitas vezes existem apenas na memória e na transmissão oral.

A proposta parte de uma ideia simples:

> Muitas das histórias mais importantes de uma família nunca chegam a ser registradas.

Experiências de infância, trabalho, viagens, receitas, tradições, acontecimentos, relacionamentos, conselhos e aprendizados podem desaparecer quando deixam de ser transmitidos entre gerações.

O projeto transforma esse problema humano em uma experiência digital orientada por **Product Thinking**, evoluindo de um conceito inicial para um **MVP web funcional**.

---

## 💡 O Problema

Parte importante da história de uma família não está necessariamente registrada em documentos, fotografias ou arquivos digitais.

Ela permanece nas lembranças das pessoas.

Com o passar do tempo, histórias relacionadas a:

- infância;
- família;
- trabalho;
- relacionamentos;
- viagens;
- tradições;
- receitas;
- acontecimentos;
- experiências pessoais;
- aprendizados de vida;

podem deixar de ser transmitidas.

O desafio que originou o projeto é:

> **Como utilizar tecnologia para tornar o registro dessas histórias mais simples, acessível e significativo?**

---

## 🎯 Objetivo

Explorar um produto digital capaz de incentivar famílias a **capturar, organizar e preservar** suas histórias para as próximas gerações.

A proposta combina:

**Tecnologia + Memória + Storytelling + UX + Product Thinking**

---

## 🧩 Conceito da Solução

A experiência foi estruturada em três pilares:

```text
Capturar
   ↓
Organizar
   ↓
Preservar
```

### 🎙️ Capturar

Utilizar perguntas e temas como ponto de partida para recuperar histórias sobre infância, família, trabalho, viagens, tradições, acontecimentos e aprendizados.

### 🗂️ Organizar

Relacionar as histórias a pessoas, categorias e períodos, permitindo que as memórias sejam estruturadas em um acervo digital.

### 💾 Preservar

Transformar lembranças em registros digitais capazes de permanecer acessíveis e, futuramente, ser compartilhados entre gerações.

---

## 🔄 Jornada do Usuário

```text
Pessoa / Família
      ↓
Escolher uma lembrança
      ↓
Perguntas e estímulos
      ↓
Registrar a história
      ↓
Categorizar
      ↓
Salvar
      ↓
Acervo de memórias
      ↓
Buscar e explorar
      ↓
Preservar
```

---

# 🚀 MVP Interativo

O projeto evoluiu de uma landing page conceitual para um **MVP funcional publicado na web**.

Nesta versão, o usuário já consegue experimentar parte da proposta de produto.

## ✍️ Registrar uma Memória

O formulário permite registrar:

- pessoa relacionada à memória;
- título da história;
- período ou ano;
- categoria;
- texto da memória.

Categorias disponíveis:

- Infância
- Família
- Trabalho
- Viagens
- Tradições
- Receitas
- Relacionamentos
- Acontecimentos
- Aprendizados
- Outras

---

## 💡 Perguntas Inspiradoras

O MVP possui um mecanismo de perguntas para estimular lembranças e facilitar o início do registro.

Exemplos:

> Qual lembrança da sua infância você nunca gostaria de esquecer?

> Que conselho de seus pais ou avós ficou com você ao longo da vida?

> Qual tradição da sua família merece continuar existindo?

> Que história você gostaria que seus filhos, netos ou familiares conhecessem no futuro?

O usuário pode solicitar novas perguntas durante a experiência.

---

## 📚 Meu Acervo de Memórias

Depois de registrada, cada memória é transformada em um card dentro do acervo.

O card apresenta:

- categoria;
- período;
- título;
- pessoa relacionada;
- história;
- data de registro.

O sistema também apresenta um **contador de memórias preservadas**.

---

## 🔎 Busca e Filtros

O acervo pode ser explorado utilizando:

### Busca textual

A pesquisa considera:

- pessoa;
- título;
- história;
- categoria;
- período.

### Filtro por categoria

O usuário pode visualizar apenas memórias pertencentes a uma determinada categoria.

---

## 🗑️ Exclusão de Memórias

Memórias registradas podem ser removidas do acervo.

Antes da exclusão, o sistema solicita confirmação para evitar remoções acidentais.

---

## 💾 Persistência com LocalStorage

O MVP utiliza a API `localStorage` do navegador para manter as memórias registradas.

```text
Formulário
    ↓
JavaScript
    ↓
Objeto de Memória
    ↓
JSON
    ↓
LocalStorage
    ↓
Acervo
```

Isso permite que as memórias permaneçam disponíveis mesmo depois que a página é atualizada ou o navegador é fechado e aberto novamente.

### Limitações atuais

Os dados permanecem apenas no navegador e dispositivo utilizados.

Nesta versão:

- não existe sincronização entre dispositivos;
- não existe autenticação;
- não existe conta de usuário;
- não existe banco de dados remoto;
- não existe armazenamento em nuvem;
- as memórias não são enviadas para um servidor.

Essa arquitetura mantém o MVP simples e permite validar primeiro a **experiência central do produto**.

---

## 🧠 Product Thinking

O desenvolvimento do projeto parte do problema antes da tecnologia.

```text
Problema Humano
      ↓
Hipótese de Produto
      ↓
Proposta de Valor
      ↓
Jornada do Usuário
      ↓
Protótipo
      ↓
MVP
      ↓
Experimentação
      ↓
Aprendizado
      ↓
Evolução do Produto
```

A primeira versão validava principalmente a comunicação do conceito.

O MVP atual adiciona uma etapa importante:

> **O visitante deixa de apenas conhecer a ideia e passa a experimentar parte do produto.**

---

## ✨ O que a Versão Atual Demonstra

### Produto

- identificação de um problema;
- definição de proposta de valor;
- Product Thinking;
- jornada do usuário;
- evolução incremental;
- definição de MVP;
- separação entre funcionalidades atuais e roadmap.

### Front-end

- HTML5;
- CSS3;
- JavaScript;
- manipulação do DOM;
- formulários;
- eventos;
- renderização dinâmica;
- responsividade;
- navegação mobile;
- scroll suave;
- animações de interface.

### Dados

- criação de objetos JavaScript;
- serialização em JSON;
- armazenamento com `localStorage`;
- leitura e atualização de registros;
- busca textual;
- filtros;
- exclusão de dados.

### UX

- perguntas inspiradoras;
- feedback de registro;
- estado vazio do acervo;
- confirmação de exclusão;
- busca;
- categorização;
- organização visual das histórias.

### Deploy

- versionamento com Git;
- repositório GitHub;
- deploy público com Vercel.

---

## 📂 Estrutura Atual do Projeto

```text
Memorias-Invisiveis-Preservando-Historias-Antes-Que-Se-Apaguem/
│
├── README.md
├── index.html
├── script.js
└── style.css
```

### Arquivos

**README.md**  
Documentação, visão do produto, funcionalidades, arquitetura atual e roadmap.

**index.html**  
Estrutura da interface, narrativa do produto, jornada, formulário de registro e acervo.

**style.css**  
Identidade visual, componentes, formulário, cards, responsividade e experiência mobile.

**script.js**  
Interações da interface e lógica do MVP, incluindo registro, `localStorage`, renderização do acervo, busca, filtros e exclusão.

---

## 🛠️ Tecnologias

| Tecnologia | Aplicação |
|---|---|
| HTML5 | Estrutura semântica |
| CSS3 | Interface e responsividade |
| JavaScript | Lógica e interatividade |
| LocalStorage | Persistência local |
| JSON | Estruturação dos registros |
| Git | Versionamento |
| GitHub | Repositório e documentação |
| Vercel | Deploy público |

---

## 🏗️ Arquitetura Atual

```text
Usuário
   ↓
Interface Web
   ↓
HTML + CSS
   ↓
JavaScript
   ↓
Registro da Memória
   ↓
Objeto JavaScript
   ↓
JSON
   ↓
LocalStorage
   ↓
Acervo
   ↓
Busca / Filtro / Exclusão
```

A arquitetura foi mantida propositalmente simples para validar a experiência antes da introdução de infraestrutura adicional.

---

## 🗺️ Roadmap

Com o MVP funcional, as próximas evoluções podem ser divididas em três camadas.

### 👨‍👩‍👧‍👦 Produto

- perfis familiares;
- múltiplos usuários;
- linha do tempo familiar;
- relações entre pessoas;
- fotografias;
- áudio;
- vídeo;
- lugares;
- compartilhamento entre familiares;
- configurações de privacidade.

### ☁️ Plataforma

Uma futura evolução poderá introduzir uma camada de backend:

```text
Front-end
    ↓
API
    ↓
Backend
    ↓
Banco de Dados
    ↓
Armazenamento em Nuvem
```

Possibilidades:

- autenticação;
- banco de dados;
- API;
- armazenamento de mídia;
- sincronização entre dispositivos;
- controle de acesso;
- histórico e versionamento;
- backup.

> A camada de backend ainda não está implementada no MVP atual.

### 🤖 Inteligência Artificial

Uma futura camada de IA poderia ajudar a transformar registros não estruturados em um acervo familiar inteligente.

Possibilidades:

- transcrição automática de áudio;
- resumo de histórias;
- identificação de pessoas;
- identificação de datas;
- identificação de lugares;
- classificação automática por temas;
- geração de tags;
- relacionamento entre histórias;
- busca semântica;
- sugestões inteligentes de perguntas;
- organização automática do acervo.

---

## 🤖 Visão de Evolução com IA

```text
Áudio / Texto / Fotos
        ↓
Processamento
        ↓
Transcrição
        ↓
Extração de entidades
        ↓
Pessoas / Datas / Lugares
        ↓
Classificação
        ↓
Resumo + Tags
        ↓
Embeddings
        ↓
Busca Semântica
        ↓
Acervo Familiar Inteligente
```

> **A versão atual não implementa modelos de Inteligência Artificial.**

A IA permanece como uma possibilidade de evolução e não é apresentada como funcionalidade existente.

---

## 🔮 Visão de Produto

Uma evolução futura poderia transformar o Memórias Invisíveis em uma plataforma onde diferentes gerações colaboram na construção de um acervo familiar.

```text
Avós
  ↓
Pais
  ↓
Filhos
  ↓
Netos
  ↓
Histórias
  ↓
Fotos + Áudio + Vídeo
  ↓
Linha do Tempo
  ↓
Acervo Familiar
  ↓
Memória entre Gerações
```

O objetivo não seria apenas armazenar arquivos.

Seria preservar **contexto, histórias, relações e significado**.

---

## ⚠️ Escopo Atual

**Memórias Invisíveis** é atualmente um MVP experimental, educacional e de portfólio.

O projeto demonstra uma experiência funcional de registro, persistência local, organização, busca, filtragem e exclusão de memórias diretamente no navegador.

As funcionalidades apresentadas no roadmap representam possibilidades futuras e não devem ser interpretadas como funcionalidades já disponíveis.

O projeto não oferece atualmente armazenamento permanente em nuvem ou garantias de preservação dos registros.

---

## 🌐 Deploy

O MVP está publicado na Vercel:

### 🔗 https://memorias-invisiveis.vercel.app/

O deploy público utiliza a versão do projeto mantida no GitHub.

---

## 💼 Competências Demonstradas

- Product Thinking
- Product Discovery
- MVP
- Front-end Development
- HTML5
- CSS3
- JavaScript
- DOM Manipulation
- LocalStorage
- JSON
- UX/UI
- Responsive Web Design
- Storytelling
- Prototipação
- Jornada do Usuário
- Estruturação de Problemas
- Arquitetura Web
- Git
- GitHub
- Deploy
- Vercel
- Visão de evolução com IA

---

## 👨‍💻 Autor

**Marcus Guedes**

Marketing | Data Science | Inteligência Artificial | Gestão de Projetos

GitHub: **MCLG1661**

---

## 📖 Memórias Invisíveis

**Toda família tem histórias que merecem ser preservadas.**

De uma lembrança contada hoje pode nascer uma conexão entre gerações amanhã.
