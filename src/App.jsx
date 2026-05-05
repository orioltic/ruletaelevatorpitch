import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Save, Trash2, Settings, Volume2, VolumeX, ArrowRight, Users, CheckCircle, Square } from 'lucide-react';

// --- CONFIGURACIÓN DE AUDIO (Web Audio API) ---
// Usamos sintetizadores para no depender de archivos externos y que funcione offline
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const playSound = (type) => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === 'tick') {
    // Sonido de tictac de ruleta
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'win') {
    // Sonido de victoria (campana)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    osc.start(now);
    osc.stop(now + 1.5);
  } else if (type === 'alarm') {
    // Sonido de alerta (10 segundos finales)
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  }
};

// --- COLORES DE LA RULETA ---
const WHEEL_COLORS = [
  '#EF476F', // Rosa
  '#FFD166', // Amarillo
  '#06D6A0', // Verde
  '#118AB2', // Azul
  '#073B4C', // Azul oscuro
  '#9D4EDD', // Violeta
  '#FF9F1C', // Naranja
  '#48C9B0', // Turquesa
];

const App = () => {
  // --- ESTADOS ---
  const [screen, setScreen] = useState('config'); // config, roulette, timer, winner
  const [groups, setGroups] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Cargar datos al inicio
  useEffect(() => {
    const saved = localStorage.getItem('classRouletteGroups');
    if (saved) {
      const parsed = JSON.parse(saved);
      setGroups(parsed);
      setTextInput(parsed.join('\n'));
    }
  }, []);

  // Guardar datos al cambiar
  useEffect(() => {
    localStorage.setItem('classRouletteGroups', JSON.stringify(groups));
  }, [groups]);

  // --- FUNCIONES DE NAVEGACIÓN ---
  const handleUpdateGroups = () => {
    const list = textInput.split('\n').filter(line => line.trim() !== '');
    setGroups(list);
    if (list.length > 0) setScreen('roulette');
  };

  const handleClearGroups = () => {
    setGroups([]);
    setTextInput('');
    localStorage.removeItem('classRouletteGroups');
  };

  const handleGroupSelected = (group) => {
    setSelectedGroup(group);
  };

  const removeSelectedGroupAndContinue = () => {
    const newGroups = groups.filter(g => g !== selectedGroup);
    setGroups(newGroups);
    // Actualizamos también el input para mantener coherencia si vuelven a config
    setTextInput(newGroups.join('\n'));
    setSelectedGroup(null);
    
    if (newGroups.length === 0) {
      // Si no quedan grupos, volver a config o mostrar fin
      setScreen('config');
      alert("¡Todos los grupos han participado!");
    } else {
      setScreen('roulette');
    }
  };

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-purple-500 overflow-hidden flex flex-col">
      {/* Header Simple */}
      <header className="p-4 flex justify-between items-center bg-slate-800/50 backdrop-blur-md border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold text-lg">R</div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Ruleta de Clase
          </h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-slate-400 hover:text-white transition">
            {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
          {screen !== 'config' && (
            <button onClick={() => setScreen('config')} className="text-slate-400 hover:text-white transition" title="Configuración">
              <Settings size={24} />
            </button>
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 relative">
        
        {screen === 'config' && (
          <div className="w-full max-w-2xl bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 text-center">Configurar Grupos</h2>
            <div className="mb-4">
              <label className="block text-slate-400 mb-2 text-sm uppercase tracking-wider font-semibold">
                Nombres de los grupos (uno por línea)
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Grupo 1&#10;Los Invencibles&#10;Equipo A&#10;..."
                className="w-full h-64 bg-slate-900 border border-slate-700 rounded-xl p-4 text-lg text-white focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
              />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleClearGroups}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-700 hover:bg-red-900/50 text-slate-300 hover:text-red-400 transition font-bold"
              >
                <Trash2 size={20} /> Borrar Todo
              </button>
              <button 
                onClick={handleUpdateGroups}
                disabled={!textInput.trim()}
                className="flex-[2] flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/50 transition transform hover:scale-105 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} /> Guardar y Generar Ruleta
              </button>
            </div>
          </div>
        )}

        {screen === 'roulette' && (
          <RouletteScreen 
            groups={groups} 
            onWin={handleGroupSelected} 
            soundEnabled={soundEnabled}
            onGoToTimer={() => setScreen('timer')}
          />
        )}

        {screen === 'timer' && selectedGroup && (
          <TimerScreen 
            groupName={selectedGroup} 
            onComplete={removeSelectedGroupAndContinue}
            soundEnabled={soundEnabled}
          />
        )}

      </main>
      
      {/* Footer info */}
      <footer className="p-2 text-center text-slate-600 text-xs">
        {groups.length} grupos en total
      </footer>
    </div>
  );
};

// --- COMPONENTE: RULETA ---
const RouletteScreen = ({ groups, onWin, soundEnabled, onGoToTimer }) => {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  
  // Dibujar la ruleta
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 20;

    ctx.clearRect(0, 0, width, height);
    
    // Sombras
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(0,0,0,0.5)";

    const sliceAngle = (2 * Math.PI) / groups.length;

    groups.forEach((group, i) => {
      const startAngle = i * sliceAngle + (rotation * Math.PI) / 180;
      const endAngle = (i + 1) * sliceAngle + (rotation * Math.PI) / 180;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.stroke();

      // Texto
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px sans-serif";
      ctx.shadowBlur = 0; // Quitar sombra para texto limpio
      ctx.fillText(group.substring(0, 18) + (group.length > 18 ? '...' : ''), radius - 20, 6);
      ctx.restore();
    });

    // Triángulo selector (Flecha a la derecha)
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(width - 10, centerY);
    ctx.lineTo(width - 40, centerY - 15);
    ctx.lineTo(width - 40, centerY + 15);
    ctx.closePath();
    ctx.fill();

    // Centro decorativo
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = "#1e293b"; // Slate 800
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "white";
    ctx.stroke();

  }, [groups, rotation]);

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWinner(null);
    onWin(null);

    // Cálculos de giro
    const minSpins = 5;
    const maxSpins = 10;
    const spinCount = Math.random() * (maxSpins - minSpins) + minSpins;
    const randomDegrees = Math.random() * 360;
    const totalDegrees = spinCount * 360 + randomDegrees;
    
    const duration = 4000; // 4 segundos
    const startTime = performance.now();
    const startRotation = rotation;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutCubic)
      const ease = 1 - Math.pow(1 - progress, 3);
      
      const currentRotation = startRotation + (totalDegrees * ease);
      setRotation(currentRotation);

      // Sonido de "tick" basado en el movimiento
      // Simplificado: reproducir sonido cada ciertos grados
      if (soundEnabled && progress < 1) {
          const sliceDeg = 360 / groups.length;
          // Lógica básica para no saturar el audio
          if (Math.floor(currentRotation / sliceDeg) !== Math.floor((currentRotation - (totalDegrees*ease*0.05)) / sliceDeg)) {
             // Reducimos frecuencia de tick al final
             if (Math.random() > progress * 0.5) playSound('tick');
          }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        // Calcular ganador
        // La flecha está en 0 grados (derecha). 
        // El canvas rota en sentido horario visualmente.
        const normalizedRotation = currentRotation % 360;
        const sliceAngleDeg = 360 / groups.length;
        
        // El índice es inverso porque la ruleta gira clockwise pero los índices "pasan" por la flecha
        // La flecha está a la derecha (0 grados del círculo trigonométrico)
        // Necesitamos encontrar qué segmento está tocando 0 grados.
        const index = Math.floor(((360 - normalizedRotation) % 360) / sliceAngleDeg);
        const winningGroup = groups[index];
        setWinner(winningGroup);
        onWin(winningGroup);
        if (soundEnabled) playSound('win');
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center animate-fade-in w-full">
      <div className="relative mb-8">
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={500} 
          className="max-w-[90vw] max-h-[50vh] w-auto h-auto cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={spin}
        />
      </div>

      {!winner ? (
        <button 
          onClick={spin}
          disabled={isSpinning}
          className={`
            py-4 px-12 rounded-full text-2xl font-bold shadow-xl transition-all transform
            ${isSpinning 
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed scale-95' 
              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 hover:scale-110 text-white'
            }
          `}
        >
          {isSpinning ? 'Girando...' : 'GIRAR RULETA'}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-6 animate-slide-up bg-slate-800/80 p-6 rounded-3xl border border-slate-600 backdrop-blur-sm w-full max-w-lg">
          <div className="text-center">
            <span className="text-slate-400 uppercase text-sm tracking-widest font-bold">Grupo Seleccionado</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 my-2 filter drop-shadow-lg">
              {winner}
            </h2>
          </div>
          
          <div className="flex gap-4 w-full">
             <button 
              onClick={spin}
              className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition font-semibold"
            >
              <RotateCcw size={24} className="mb-1"/>
              Repetir Giro
            </button>
            <button 
              onClick={onGoToTimer}
              className="flex-[2] flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg transition transform hover:scale-105 font-bold text-xl"
            >
              <Play size={32} className="mb-1 fill-current"/>
              JUGAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE: CRONÓMETRO ---
const TimerScreen = ({ groupName, onComplete, soundEnabled }) => {
  const INITIAL_TIME = 3 * 60; // 3 minutos
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showWarning, setShowWarning] = useState(false); // Para los ultimos 10s

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      setIsFinished(true);
      if (soundEnabled) playSound('win');
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, soundEnabled]);

  // Efecto de alarma a los 10 segundos
  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0 && isRunning) {
      setShowWarning(true);
      if (soundEnabled && timeLeft % 2 === 0) { // Sonido intermitente suave
         playSound('alarm');
      }
    } else {
      setShowWarning(false);
    }
  }, [timeLeft, isRunning, soundEnabled]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(INITIAL_TIME);
    setIsFinished(false);
  };

  // Función para terminar antes de tiempo
  const finishEarly = () => {
    setIsRunning(false);
    setIsFinished(true);
    if (soundEnabled) playSound('win');
  };

  return (
    <div className={`
      absolute inset-0 flex flex-col items-center justify-center transition-colors duration-500 z-50
      ${showWarning ? 'bg-red-900 animate-pulse-slow' : 'bg-slate-900'}
      ${isFinished ? 'bg-emerald-900' : ''}
    `}>
      
      {/* Cabecera del grupo */}
      <div className="absolute top-10 text-center w-full px-4">
         <h3 className="text-2xl text-slate-400 font-light">Turno de</h3>
         <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-lg mt-2">{groupName}</h1>
      </div>

      {/* Contador Gigante */}
      <div className="relative z-10 my-8">
        <div className={`text-[15vw] leading-none font-mono font-bold tracking-tighter tabular-nums transition-colors duration-300 ${showWarning ? 'text-red-300' : 'text-white'}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Mensaje de aviso */}
      {showWarning && (
         <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 text-center pointer-events-none opacity-20">
            <span className="text-6xl md:text-8xl font-black text-white uppercase animate-bounce">
              ¡APLAUSOS!
            </span>
         </div>
      )}
       {showWarning && (
         <div className="mb-8 bg-red-600 text-white px-6 py-2 rounded-full font-bold text-xl animate-bounce shadow-lg z-20">
            📢 ¡Id preparando esos aplausos...
         </div>
      )}

      {/* Controles */}
      {!isFinished ? (
        <div className="flex gap-6 z-20 items-center">
          {/* Botón Reiniciar (Izquierda) */}
          <button 
            onClick={resetTimer}
            className="w-14 h-14 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition text-slate-300"
            title="Reiniciar 3:00"
          >
            <RotateCcw size={20} />
          </button>
          
          {/* Botón Play/Pause (Centro - Grande) */}
          <button 
            onClick={toggleTimer}
            className={`
              w-24 h-24 rounded-full flex items-center justify-center transition transform hover:scale-105 shadow-2xl
              ${isRunning ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-green-500 hover:bg-green-400'}
            `}
            title={isRunning ? "Pausar" : "Iniciar"}
          >
            {isRunning ? <Pause size={40} className="fill-current text-white" /> : <Play size={40} className="fill-current text-white ml-2" />}
          </button>

          {/* Botón Stop/Terminar (Derecha) */}
          <button 
            onClick={finishEarly}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition text-white shadow-lg"
            title="Terminar antes de tiempo"
          >
            <Square size={20} fill="currentColor" />
          </button>
        </div>
      ) : (
        <div className="z-20 text-center animate-slide-up">
          <h2 className="text-4xl font-bold text-white mb-8 drop-shadow-md">¡Tiempo Terminado! 👏</h2>
          <button 
            onClick={onComplete}
            className="group relative px-8 py-4 bg-white text-slate-900 text-xl font-bold rounded-xl hover:bg-slate-200 transition shadow-xl overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Continuar y Eliminar Grupo <ArrowRight size={24} />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 opacity-0 group-hover:opacity-20 transition" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
