# Estado do projeto (Corrida AI)

## Feito
- Login/registo (email, senha, nome, data de nascimento) com backend Express + SQLite + JWT.
- Treinos e progressão guardados por utilizador; a etapa seguinte só avança se o treino correu bem e sem dor.
- Planeador seguro (server/planner.mjs): progressivo, nunca passa de 10 km; a IA só personaliza dentro das regras.
- Mobilidade/alongamentos escolhidos pelas zonas com dor e pelo cansaço; 23 exercícios (shared/exercises.json).
- Robô animado que pisca (src/components/RobotMascot.tsx) + botão "Fale com o assistente".
- Boneco 3D (Y Bot) a fazer cada exercício com poses próprias (src/lib/avatar/poses.ts), com animações Mixamo opcionais.
- Português/Inglês em toda a app (src/i18n), com troca nos ecrãs de login e no Perfil.

## Por testar num telemóvel real
- O desenho 3D no Expo Go (testado só em Node + empacotamento; ver GUIA.md).
- A IA com a chave real (testado só o caminho sem IA).

## Ideias seguintes
- Animações Mixamo reais para os exercícios (ver src/data/animations.ts).
- Lembretes nos dias escolhidos; gráfico de evolução.
