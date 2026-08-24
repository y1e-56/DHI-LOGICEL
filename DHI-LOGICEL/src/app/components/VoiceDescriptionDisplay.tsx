import { DescriptionAudio } from '../types';

export function VoiceDescriptionDisplay({ audio }: { audio?: DescriptionAudio }) {
  if (!audio?.audioData) return null;
  return (
    <div className="flex flex-col gap-1.5 mt-2">
      <audio controls src={audio.audioData} className="h-9 max-w-full" />
    </div>
  );
}
