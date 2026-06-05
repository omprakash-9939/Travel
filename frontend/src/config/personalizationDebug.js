export const P13N_DEBUG =
  process.env.REACT_APP_P13N_DEBUG === 'true' ||
  (typeof window !== 'undefined' && localStorage.getItem('p13n_debug') === '1');
