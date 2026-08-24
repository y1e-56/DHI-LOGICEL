import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Mic, Square, Trash2, Check, Loader2 } from 'lucide-react';
import { cn } from './ui/utils';

type RecordingResult = {
  audioData: string;
  audioType: string;
  durationSeconds: number;
};

type Props = {
  onRecorded: (result: RecordingResult) => void;
  onCancel?: () => void;
  disabled?: boolean;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function fileToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function VoiceMessageRecorder({ onRecorded, onCancel, disabled }: Props) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<{ url: string; blob: Blob; type: string } | null>(null);
  const [converting, setConverting] = useState(false);
  const [supported, setSupported] = useState(true);
  const durationRef = useRef(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
    setSupported(hasMediaRecorder);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(track => track.stop());
      if (preview) URL.revokeObjectURL(preview.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  };

  const startRecording = async () => {
    setElapsed(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported(t)) || '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        cleanup();
        const url = URL.createObjectURL(blob);
        setPreview({ url, blob, type: recorder.mimeType || 'audio/webm' });
      };
      recorder.start();

      timerRef.current = window.setInterval(() => {
        setElapsed(s => s + 1);
      }, 1000);

      setRecording(true);
    } catch {
      setSupported(false);
    }
  };

  const stopRecording = () => {
    durationRef.current = elapsed;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setElapsed(0);
  };

  const confirmRecording = async () => {
    if (!preview) return;
    setConverting(true);
    try {
      const audioData = await fileToBase64(preview.blob);
      onRecorded({
        audioData,
        audioType: preview.type,
        durationSeconds: durationRef.current,
      });
      resetPreview();
    } finally {
      setConverting(false);
    }
  };

  const resetPreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    durationRef.current = 0;
  };

  if (!supported) {
    return (
      <p className="text-xs text-red-500 flex items-center gap-1.5">
        <Mic className="w-3.5 h-3.5" />
        {t('comment.voice_unsupported')}
      </p>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        <span className="text-sm font-mono text-red-600 tabular-nums">{formatDuration(elapsed)}</span>
        <Button size="sm" variant="destructive" onClick={stopRecording} className="gap-1.5">
          <Square className="w-3.5 h-3.5 fill-current" />
          {t('comment.stop')}
        </Button>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <audio controls src={preview.url} className="h-9 max-w-[240px]" />
        <Button size="sm" variant="ghost" onClick={resetPreview} className="gap-1.5 text-slate-500">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" onClick={confirmRecording} disabled={converting} className="gap-1.5">
          {converting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {t('comment.confirm_audio')}
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={startRecording}
      disabled={disabled}
      className={cn('gap-1.5 text-red-600 border-red-300 hover:bg-red-50')}
    >
      <Mic className="w-3.5 h-3.5" />
      {t('comment.record_voice')}
    </Button>
  );
}
