import logoUrl from '../assets/logo.svg';

export default function DEdgeLogo({ height = 20 }) {
  return (
    <img
      src={logoUrl}
      alt="D-EDGE"
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
}
