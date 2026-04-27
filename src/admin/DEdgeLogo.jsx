const LOGO_URL =
  'https://www.d-edge.com/wp-content/themes/d-edge/img/logo_d-edge.svg';

export default function DEdgeLogo({ height = 20 }) {
  return (
    <img
      src={LOGO_URL}
      alt="D-EDGE"
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
}
