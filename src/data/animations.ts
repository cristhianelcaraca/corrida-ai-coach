// animations.ts — animações do Mixamo (opcional).
//
// A app já mostra TODOS os exercícios com o boneco Y Bot e poses próprias
// (src/lib/avatar/poses.ts). Se quiseres usar uma animação real do Mixamo
// para um exercício, descarrega-a em formato FBX (sem "skin"), coloca-a em
// assets/animations/ e acrescenta UMA linha aqui. Exemplo:
//
//   neck_stretch: require("../../assets/animations/neck_stretch.fbx"),
//
// (O nome à esquerda tem de ser o id do exercício, ver shared/exercises.json.)
// Importante: o ficheiro tem de existir, senão a app não compila.
export const MIXAMO_ANIMATIONS: Record<string, number> = {
  // neck_stretch: require("../../assets/animations/neck_stretch.fbx"),
};
