import type { ProfileFormData, ValidationError } from '../types/auth';

export function validateProfileForm(data: ProfileFormData): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // 表示名のバリデーション
  if (!data.display_name || data.display_name.trim().length === 0) {
    errors.push({
      field: 'display_name',
      message: '表示名は必須です'
    });
  } else if (data.display_name.length > 50) {
    errors.push({
      field: 'display_name',
      message: '表示名は50文字以内で入力してください'
    });
  }

  // 自己紹介のバリデーション
  if (data.bio && data.bio.length > 500) {
    errors.push({
      field: 'bio',
      message: '自己紹介は500文字以内で入力してください'
    });
  }

  // 連絡先情報のバリデーション
  if (data.contact.email && !isValidEmail(data.contact.email)) {
    errors.push({
      field: 'contact.email',
      message: '有効なメールアドレスを入力してください'
    });
  }

  if (data.contact.url && !isValidUrl(data.contact.url)) {
    errors.push({
      field: 'contact.url',
      message: '有効なURLを入力してください'
    });
  }

  if (data.contact.twitter && !isValidTwitterHandle(data.contact.twitter)) {
    errors.push({
      field: 'contact.twitter',
      message: 'Twitterハンドルは@usernameの形式で入力してください'
    });
  }

  if (data.contact.github && !isValidGitHubUsername(data.contact.github)) {
    errors.push({
      field: 'contact.github',
      message: 'GitHubユーザー名は英数字とハイフンのみ使用できます'
    });
  }

  if (data.contact.linkedin && !isValidLinkedInUsername(data.contact.linkedin)) {
    errors.push({
      field: 'contact.linkedin',
      message: 'LinkedInユーザー名は英数字とハイフンのみ使用できます'
    });
  }

  // アバター画像のバリデーション
  if (data.avatar) {
    if (!isValidImageFile(data.avatar)) {
      errors.push({
        field: 'avatar',
        message: '画像ファイル（JPG、PNG、GIF）を選択してください'
      });
    }

    if (data.avatar.size > 5 * 1024 * 1024) {
      errors.push({
        field: 'avatar',
        message: '画像ファイルは5MB以下にしてください'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidTwitterHandle(handle: string): boolean {
  const twitterRegex = /^@?[a-zA-Z0-9_]{1,15}$/;
  return twitterRegex.test(handle);
}

function isValidGitHubUsername(username: string): boolean {
  const githubRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]){0,38}$/;
  return githubRegex.test(username);
}

function isValidLinkedInUsername(username: string): boolean {
  const linkedinRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]){0,100}$/;
  return linkedinRegex.test(username);
}

function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  return validTypes.includes(file.type);
}

// リアルタイムバリデーション用のヘルパー関数
export function validateField(field: string, value: string): string | null {
  switch (field) {
    case 'display_name':
      if (!value || value.trim().length === 0) {
        return '表示名は必須です';
      }
      if (value.length > 50) {
        return '表示名は50文字以内で入力してください';
      }
      break;
    
    case 'bio':
      if (value.length > 500) {
        return '自己紹介は500文字以内で入力してください';
      }
      break;
    
    case 'contact.email':
      if (value && !isValidEmail(value)) {
        return '有効なメールアドレスを入力してください';
      }
      break;
    
    case 'contact.url':
      if (value && !isValidUrl(value)) {
        return '有効なURLを入力してください';
      }
      break;
    
    case 'contact.twitter':
      if (value && !isValidTwitterHandle(value)) {
        return 'Twitterハンドルは@usernameの形式で入力してください';
      }
      break;
    
    case 'contact.github':
      if (value && !isValidGitHubUsername(value)) {
        return 'GitHubユーザー名は英数字とハイフンのみ使用できます';
      }
      break;
    
    case 'contact.linkedin':
      if (value && !isValidLinkedInUsername(value)) {
        return 'LinkedInユーザー名は英数字とハイフンのみ使用できます';
      }
      break;
  }
  
  return null;
}
