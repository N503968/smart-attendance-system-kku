import { Button } from './ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Language } from '../lib/i18n';

interface BackButtonProps {
  onClick: () => void;
  language: Language;
  label?: string;
}

export function BackButton({ onClick, language, label }: BackButtonProps) {
  const isArabic = language === 'ar';
  const defaultLabel = isArabic ? 'رجوع' : 'Back';
  const Icon = isArabic ? ArrowRight : ArrowLeft;

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="gap-2 hover:bg-primary/10 transition-colors"
    >
      <Icon className="w-5 h-5" />
      <span>{label || defaultLabel}</span>
    </Button>
  );
}
