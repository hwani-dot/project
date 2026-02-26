interface HomeProfileGuardProps {
  children: React.ReactNode;
}

/**
 * 홈(/)은 프로필 유무와 관계없이 표시.
 * 프로필이 없으면 Hero 오른쪽에 "정보 입력 필요" 카드를 보여준다.
 */
export function HomeProfileGuard({ children }: HomeProfileGuardProps) {
  return <>{children}</>;
}
