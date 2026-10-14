# Guia da Corrida AI

## 1. Como correr

**Servidor (1.º terminal)**
```
cd server
npm install
cp .env.example .env     # abre o .env e põe a tua OPENAI_API_KEY e um JWT_SECRET longo
npm start                # deve aparecer: Corrida AI backend: http://0.0.0.0:3000
npm test                 # (opcional) corre os testes automáticos da API
```
Sem `OPENAI_API_KEY` o servidor funciona na mesma: usa só o planeador de regras.

**App (2.º terminal, na pasta principal)**
```
npm install
npx expo start -c
```
O telemóvel e o computador têm de estar na mesma rede Wi-Fi. A app descobre sozinha o IP do computador (porta 3000). Em produção define `EXPO_PUBLIC_API_URL` (ver `.env.example`).

## 2. O que encontrei no teu projeto (e já está corrigido)

1. **O `.fbx` nunca carregava** porque o `metro.config.js` só conhecia `glb` e `gltf`. Acrescentei `"fbx"`.
2. **O `Ybot01.fbx` não é uma animação.** Tem só 1–2 imagens (0,03 s) e o pescoço em posição neutra: é o boneco em T-pose. Ainda não descarregaste nenhuma animação do Mixamo. Por isso criei um motor de poses que move o teu `ybot.glb` e mostra **todos** os exercícios já agora. As animações do Mixamo ficam como melhoria opcional (secção 5).
3. O `ybot.glb` tem **dois esqueletos** (`mixamorigHips` e `mixamorigHips_1`). O motor move os dois.
4. A navegação era só `Stack`; as tabs (`app-tabs.tsx`) nunca eram usadas. Agora há tabs reais.

## 3. Estrutura nova

```
server/
  index.mjs    API: registo, login, perfil, treinos, progresso
  planner.mjs  treino progressivo e seguro (nunca > 10 km) + escolha de mobilidade por dor
  ai.mjs       a IA personaliza textos e escolhe alongamentos; tudo é validado
  db.mjs       base de dados SQLite (ficheiro server/data/corrida.db)
  test.mjs     testes automáticos
shared/exercises.json   os 23 exercícios (pt/en), usados pelo servidor E pela app
src/
  app/_layout.tsx        sessão + idioma; sem login -> ecrã de login
  app/(auth)/            login.tsx, registo.tsx
  app/(app)/             index (início), plano, mobilidade, assistente, perfil
  components/            RobotMascot, ExerciseAvatar, AvatarViewer, ui
  lib/avatar/            poseEngine.ts, poses.ts, mixamo.ts, loader.ts
  i18n/                  pt.ts, en.ts, index.tsx
  data/animations.ts     onde registas animações do Mixamo
```

## 4. Como funcionam as peças principais

### 4.1 O robô que pisca (`RobotMascot.tsx`)
É desenhado com `View`s (sem imagem). O piscar é um número `blink` que vai de 1 (olhos abertos) a 0.08 (fechados) e volta:
```tsx
Animated.timing(blink, { toValue: 0.08, duration: 90, useNativeDriver: true }),
Animated.timing(blink, { toValue: 1,    duration: 130, useNativeDriver: true }),
```
Cada olho tem `transform: [{ scaleY: blink }]`: se `blink` desce, o olho achata. `Animated.loop` repete com pausas (`Animated.delay`) e uma piscadela dupla. No `useEffect`, o `return () => loop.stop()` pára tudo quando o ecrã fecha.

### 4.2 O plano seguro (`server/planner.mjs`)
- `STAGES` é a tabela de progressão: `[minutos a correr, minutos a caminhar, repetições]`, de 1 min de corrida até 90 min.
- `nextStage` escolhe a etapa: sobe 1 só se o último treino foi concluído **sem** esforço "difícil" e **sem** dor; recua 2 etapas se passaram mais de 14 dias.
- Hoje cansado(a) ou dor 4–6: desce 1 etapa. Dor 7 ou mais: **sem corrida**, só recuperação.
- A distância usa um ritmo estimado por nível e **nunca passa de 10 km** (`MAX_KM`), nem do objetivo escolhido (5 km, 10 km).
- `pickMobility` / `pickStretches` dão pontos aos exercícios que trabalham as zonas com dor e **excluem** os que a campo `avoid` desaconselha (ex.: joelho com dor → sem agachamento nem alongamento do quadríceps).

### 4.3 A IA (`server/ai.mjs`)
A IA recebe a estrutura já pronta e só pode: reescrever instruções, e escolher mobilidade/alongamentos **entre os ids permitidos** (`enum` no schema). Tudo o que devolve é validado; se falhar ou não houver chave, o plano de regras é usado e a app avisa.

### 4.4 Login e dados (`server/index.mjs`)
- `bcrypt` guarda a senha como hash (nunca em texto). O login devolve um **token JWT** (30 dias) que a app guarda no `SecureStore` e envia em cada pedido (`Authorization: Bearer …`).
- Tabelas: `users`, `profiles`, `workouts` (com `completed_at` e `feedback`). Cada utilizador só vê os seus (as consultas filtram por `user_id`).
- A data de nascimento é validada (mínimo 16 anos). Há limite de tentativas nas rotas de login.

### 4.5 O boneco 3D (`src/lib/avatar/`)
- **Eixos do mundo**: X = esquerda do boneco, Y = cima, Z = frente. Cada exercício é uma lista de poses-chave com ângulos em graus. Exemplo, inclinar o pescoço: `neck: [0, 0, -30]` (rodar à volta de Z).
- O Mixamo tem eixos locais confusos, por isso o `PoseRig` calcula a rotação local de cada osso a partir da rotação desejada no mundo. `abs: true` faz um osso ignorar o pai (pé sempre plano).
- **Chão automático**: depois de cada pose, o motor desce ou sobe o corpo para que o ponto mais baixo dos pés fique no chão (agachamentos e passadas funcionam sem "voar").
- `bothSides` cria o lado esquerdo e o espelho (direito) de um alongamento.
- Só **um** `GLView` é desenhado de cada vez (na janela do plano e no separador Mobilidade, que pára quando não está visível), para poupar bateria.

## 5. Usar animações reais do Mixamo (opcional)
1. No mixamo.com escolhe a animação (ex.: pesquisa "stretch"), com o teu Y Bot, e descarrega em **FBX**, *Without Skin*, 30 fps.
2. Coloca em `assets/animations/neck_stretch.fbx`.
3. Em `src/data/animations.ts` acrescenta: `neck_stretch: require("../../assets/animations/neck_stretch.fbx"),`. O nome é o id do exercício.
4. `npx expo start -c`. Se o FBX falhar, a app volta sozinha às poses internas.

## 6. O que foi testado (e o que não)
- ✅ API: registo, login, perfil, treino, concluir, progressão, isolamento entre utilizadores (`npm test`).
- ✅ Planeador: progressão ao longo de 20 sessões, joelho, pescoço, dor forte, limite de 10 km.
- ✅ Poses: carreguei o teu `ybot.glb` e desenhei cada exercício (imagens de palitos); corrigi passada, flexão e ombro.
- ✅ Conversão Mixamo → Y Bot: animação sintética, erro 0,00 cm.
- ✅ `tsc` sem erros nos meus ficheiros e o Metro empacota a app inteira para iOS (1804 módulos).
- ⚠️ **Não testei num telemóvel nem na web** e não usei uma chave real da OpenAI. O 3D usa a mesma configuração do teu `gl-test`, mas confirma no Expo Go e diz-me o que vês.
- Os ficheiros `animated-icon*`, `hint-row`, `web-badge`, `external-link` e `src/global.css` são restos do modelo inicial do Expo e já não são usados.
