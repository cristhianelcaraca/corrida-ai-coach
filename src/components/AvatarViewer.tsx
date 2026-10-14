// AvatarViewer.tsx — mostra o boneco 3D (Y Bot) a fazer o movimento do exercício.
// Usa expo-gl + three.js, com a mesma configuração que já funcionava no teu gl-test.
import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import * as THREE from "three";
import { FBXLoader, GLTFLoader } from "three-stdlib";

import { MIXAMO_ANIMATIONS } from "@/data/animations";
import { loadBinary } from "@/lib/avatar/loader";
import { mixamoToClip } from "@/lib/avatar/mixamo";
import { PoseRig, type Clip } from "@/lib/avatar/poseEngine";
import { CLIPS } from "@/lib/avatar/poses";

const YBOT = require("../../assets/avatars/ybot.glb");

type Props = {
  exerciseId: string;
  angle: "front" | "side";
  onStatus?: (s: "ready" | "error") => void;
  style?: StyleProp<ViewStyle>;
};

export default function AvatarViewer({ exerciseId, angle, onStatus, style }: Props) {
  // "refs" guardam valores que o loop de animação lê sem precisar de redesenhar o componente
  const exRef = useRef(exerciseId);
  const angleRef = useRef(angle);
  const statusRef = useRef(onStatus);
  const frameRef = useRef<number | null>(null);
  const aliveRef = useRef(true);
  const changedRef = useRef(true);

  useEffect(() => {
    exRef.current = exerciseId;
    changedRef.current = true; // avisa o loop para trocar de animação
  }, [exerciseId]);
  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);
  useEffect(() => {
    statusRef.current = onStatus;
  }, [onStatus]);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  async function onContextCreate(gl: ExpoWebGLRenderingContext) {
    try {
      const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
      const fakeCanvas = { width: w, height: h, clientHeight: h, style: {}, addEventListener: () => {}, removeEventListener: () => {} };
      const renderer = new THREE.WebGLRenderer({
        canvas: fakeCanvas as unknown as HTMLCanvasElement,
        context: gl as unknown as WebGLRenderingContext,
        antialias: true,
      });
      renderer.setPixelRatio(1);
      renderer.setSize(w, h, false);
      renderer.setClearColor(0x141a16, 1);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 50);
      camera.position.set(0, 1.0, 4.4);
      camera.lookAt(0, 0.92, 0);
      scene.add(new THREE.AmbientLight(0xffffff, 2));
      const sun = new THREE.DirectionalLight(0xffffff, 3);
      sun.position.set(2, 4, 3);
      scene.add(sun);
      // chão
      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(0.9, 40),
        new THREE.MeshBasicMaterial({ color: 0x27351b }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0.002;
      scene.add(floor);

      // modelo
      const buffer = await loadBinary(YBOT);
      const gltf: any = await new Promise((res, rej) => new GLTFLoader().parse(buffer.slice(0), "", res, rej));
      if (!aliveRef.current) return;
      const model: THREE.Object3D = gltf.scene;
      const rig = new PoseRig(model); // tem de ser criado ANTES de mexermos no modelo
      const holder = new THREE.Group();
      holder.add(model);
      scene.add(holder);

      statusRef.current?.("ready");

      // estado da animação atual
      let current = "";
      let mixamoClip: Clip | null = null; // animação vinda do Mixamo (se existir para este exercício)
      let start = performance.now();
      let last = start;

      async function selectExercise(id: string) {
        current = id;
        mixamoClip = null;
        rig.reset();
        start = performance.now();
        const fbx = MIXAMO_ANIMATIONS[id];
        if (fbx) {
          try {
            const bytes = await loadBinary(fbx);
            const obj = new FBXLoader().parse(bytes.slice(0), "");
            const src = obj.animations.find((a) => a.tracks.length > 0);
            if (src && current === id) {
              rig.reset(); // o GLB tem de estar na T-pose para comparar
              mixamoClip = mixamoToClip(obj, src, model);
              start = performance.now();
            }
          } catch (e) {
            console.log("FBX Mixamo falhou, uso as poses internas:", e);
            mixamoClip = null;
          }
        }
      }

      const render = () => {
        if (!aliveRef.current) return;
        if (changedRef.current || current !== exRef.current) {
          changedRef.current = false;
          selectExercise(exRef.current);
        }
        const now = performance.now();
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;

        const clip = mixamoClip ?? CLIPS[current]; // Mixamo se existir, senão as poses internas
        if (clip) rig.apply(clip, (now - start) / 1000);
        // rodar para "frente" ou "lado" de forma suave
        const target = angleRef.current === "side" ? Math.PI / 2 : 0;
        holder.rotation.y += (target - holder.rotation.y) * Math.min(1, dt * 8);

        renderer.render(scene, camera);
        gl.endFrameEXP();
        frameRef.current = requestAnimationFrame(render);
      };
      render();
    } catch (e) {
      console.log("Erro no AvatarViewer:", e);
      statusRef.current?.("error");
    }
  }

  return (
    <View style={[styles.box, style]}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({ box: { overflow: "hidden", backgroundColor: "#141A16" } });
