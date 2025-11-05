export const today = () => new Date().toISOString().slice(0,10);
export const d = (offsetDays=0) => {
  const t = new Date();
  t.setUTCDate(t.getUTCDate()+offsetDays);
  return t.toISOString().slice(0,10);
}
