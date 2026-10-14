// pt.ts — todos os textos da app em português.
// Para acrescentar um texto: cria a chave aqui E em en.ts (o TypeScript avisa se faltar).
export const pt = {
  "app.name": "Corrida AI",
  "tab.home": "Início", "tab.plan": "Plano", "tab.mobility": "Mobilidade", "tab.assistant": "Assistente", "tab.profile": "Perfil",
  "common.save": "Guardar", "common.cancel": "Cancelar", "common.loading": "A carregar…", "common.retry": "Tentar de novo",
  "common.logout": "Terminar sessão", "common.close": "Fechar", "common.min": "min", "common.km": "km",

  "auth.email": "Email", "auth.password": "Senha", "auth.name": "Nome", "auth.birth": "Data de nascimento", "auth.birthHint": "DD/MM/AAAA",
  "login.title": "Entrar", "login.subtitle": "Bem-vindo(a) de volta! Continua o teu treino.", "login.submit": "Entrar", "login.toRegister": "Ainda não tens conta? Cria uma",
  "register.title": "Criar conta", "register.subtitle": "Cria a tua conta para guardarmos os teus treinos e a tua evolução.",
  "register.submit": "Criar conta", "register.toLogin": "Já tens conta? Entra", "register.passwordHint": "Mínimo de 8 caracteres",

  "err.network": "Não consegui ligar ao servidor. Confirma que o backend está a correr e que o telemóvel está na mesma rede.",
  "err.invalid_credentials": "Email ou senha incorretos.", "err.email_taken": "Já existe uma conta com este email.",
  "err.weak_password": "A senha precisa de pelo menos 8 caracteres.", "err.invalid_email": "Email inválido.",
  "err.invalid_name": "Escreve o teu nome.", "err.invalid_birth_date": "Data de nascimento inválida (é preciso ter pelo menos 16 anos).",
  "err.birth_format": "Escreve a data assim: DD/MM/AAAA.", "err.fill_all": "Preenche todos os campos.",
  "err.profile_required": "Completa primeiro o teu perfil.", "err.server_error": "Ocorreu um erro no servidor. Tenta mais tarde.",
  "err.unauthorized": "A sessão expirou. Entra de novo.", "err.not_found": "Não encontrado.", "err.generic": "Algo correu mal. Tenta de novo.",

  "home.greeting": "Olá, {name}!", "home.tagline": "O teu treinador de corrida com IA",
  "home.talk": "Fale com o assistente", "home.next": "O teu último treino",
  "home.empty": "Ainda não tens treino. Fala com o assistente para criar o primeiro.", "home.openPlan": "Ver plano",
  "home.stat.workouts": "Treinos", "home.stat.km": "Km", "home.stat.minutes": "Min a correr",

  "assistant.title": "Assistente de corrida", "assistant.intro": "Responde a algumas perguntas e eu crio um treino pensado para ti, com mobilidade e alongamentos para o que sentes.",
  "assistant.needProfile": "Primeiro completa o teu perfil (objetivo, nível e disponibilidade).", "assistant.goProfile": "Ir para o perfil",
  "assistant.q.feeling": "Como te sentes hoje?", "assistant.q.maxMin": "Quantos minutos consegues correr sem parar?",
  "assistant.q.pains": "Sentes dores ou desconforto? Toca nas zonas.", "assistant.q.notes": "Mais alguma coisa que eu deva saber? (opcional)",
  "assistant.notesHint": "Ex.: dormi mal, treinei ontem, dor ao descer escadas…",
  "assistant.create": "Criar o meu treino", "assistant.creating": "A criar o teu treino…",
  "assistant.aiFallback": "A IA não está disponível agora, por isso usei as regras seguras da app para montar o treino.",
  "assistant.intensity": "Intensidade da dor", "assistant.noRun": "Nunca corri", "assistant.min": "{n} min", "assistant.min30": "30+ min",
  "feeling.energy": "Com energia", "feeling.normal": "Normal", "feeling.tired": "Cansado(a)",
  "pain.mild": "Leve", "pain.moderate": "Moderada", "pain.strong": "Forte",

  "area.neck": "Pescoço", "area.shoulders": "Ombros", "area.upper_back": "Costas (alta)", "area.lower_back": "Lombar",
  "area.hips": "Anca", "area.glutes": "Glúteos", "area.quads": "Frente da coxa", "area.hamstrings": "Parte de trás da coxa",
  "area.calves": "Gémeos", "area.shins": "Canelas", "area.knees": "Joelhos", "area.ankles": "Tornozelos", "area.feet": "Pés",

  "plan.title": "O teu plano", "plan.empty": "Ainda não tens nenhum treino. Fala com o assistente para criar o primeiro.", "plan.talk": "Fale com o assistente",
  "plan.warmup": "Aquecimento", "plan.mobility": "Mobilidade", "plan.workout": "Treino principal", "plan.cooldown": "Volta à calma e alongamentos",
  "plan.view": "Ver movimento", "plan.complete": "Concluir treino", "plan.done": "Treino concluído", "plan.new": "Criar novo treino",
  "plan.duration": "Duração", "plan.intensity": "Intensidade", "plan.distance": "Distância estimada", "plan.stage": "Etapa {n}",
  "plan.safety": "Segurança", "plan.source.ai": "Personalizado por IA", "plan.source.rules": "Plano seguro automático",
  "plan.history": "Histórico", "plan.how": "Como foi o treino?", "effort.easy": "Fácil", "effort.ok": "Adequado", "effort.hard": "Difícil",
  "plan.pain": "Senti dor durante o treino", "plan.send": "Guardar resultado",
  "plan.feedbackNote": "O próximo treino só avança se correu bem e sem dor.",

  "mob.title": "Mobilidade e alongamentos", "mob.forYou": "Sugeridos para ti", "mob.all": "Todos os exercícios",
  "kind.warmup": "Aquecimento", "kind.drill": "Técnica", "kind.mobility": "Mobilidade", "kind.stretch": "Alongamento", "kind.breath": "Respiração",
  "mob.areas": "Zonas trabalhadas",

  "avatar.front": "Frente", "avatar.side": "Lado", "avatar.loading": "A carregar o boneco…",
  "avatar.error": "Não consegui mostrar o boneco 3D neste dispositivo.",

  "profile.title": "Perfil", "profile.onboarding": "Completa o teu perfil para o assistente criar treinos à tua medida.",
  "profile.age": "{n} anos", "profile.goal": "Objetivo", "profile.level": "Nível atual", "profile.days": "Dias disponíveis",
  "profile.duration": "Tempo do treino principal", "profile.limitations": "Limitações ou lesões (opcional)",
  "profile.saved": "Perfil guardado.", "profile.language": "Idioma", "profile.progress": "O teu progresso",
  "profile.last30": "Treinos nos últimos 30 dias", "profile.maxNote": "A app só cria treinos até 10 km.",
  "goal.start": "Começar a correr", "goal.5k": "Correr 5 km", "goal.10k": "Correr 10 km",
  "level.never": "Nunca corri", "level.starting": "Estou a começar", "level.regular": "Corro regularmente",
  "day.mon": "Seg", "day.tue": "Ter", "day.wed": "Qua", "day.thu": "Qui", "day.fri": "Sex", "day.sat": "Sáb", "day.sun": "Dom",
} as const;
export type TKey = keyof typeof pt;
