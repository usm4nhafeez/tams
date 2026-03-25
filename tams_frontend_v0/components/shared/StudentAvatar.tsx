import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getPhotoUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface StudentAvatarProps {
  name: string
  photoPath?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-xl',
}

export function StudentAvatar({ name, photoPath, size = 'md', className }: StudentAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {photoPath && <AvatarImage src={getPhotoUrl(photoPath)} alt={name} />}
      <AvatarFallback className="bg-[#1E3A5F] text-white font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
