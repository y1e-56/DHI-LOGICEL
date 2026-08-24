import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DescriptionAudio } from '../types';
import { VoiceMessageRecorder } from './VoiceMessageRecorder';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';

type Props = {
  value?: DescriptionAudio;
  onChange: (audio?: DescriptionAudio) => void;
  disabled?: boolean;
};

export function VoiceDescriptionInput({ value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<DescriptionAudio | null>(null);

  const audio = pending || value;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {audio ? (
        <>
          <audio controls src={audio.audioData} className="h-9 max-w-[240px]" />
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-slate-500"
            disabled={disabled}
            onClick={() => {
              setPending(null);
              onChange(undefined);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('comment.delete_audio')}
          </Button>
        </>
      ) : (
        <VoiceMessageRecorder
          onRecorded={r => {
            const rec = {
              audioData: r.audioData,
              audioType: r.audioType,
              durationSeconds: r.durationSeconds,
            };
            setPending(rec);
            onChange(rec);
          }}
          disabled={disabled}
        />
      )}
    </div>
  );
}
