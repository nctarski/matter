import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <p>
        Matter earns commission on qualifying purchases made through outbound links.
        Composition data is sourced from retailer product pages and rechecked on a schedule.
      </p>
      <p>
        <Link href="/about">Our standard</Link> · <Link href="/learn">Know your fibers</Link>
      </p>
    </footer>
  );
}
