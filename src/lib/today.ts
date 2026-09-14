// ローカル日付の YYYY-MM-DD。記録した日・メダルの獲得日・ゲートの回数・風船のベストが同じ「今日」を使う
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
