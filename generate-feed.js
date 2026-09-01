const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function generateFeed() {
  const { data: productos } = await db
    .from('productos')
    .select('*')
    .eq('activo', true)
    .gt('stock', 0)
    .order('created_at', { ascending: false });

  if (!productos || productos.length === 0) {
    console.log('No hay productos');
    return;
  }

  console.log(`Generando feed con ${productos.length} productos...`);

  const esc = s => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  let items = '';
  for (const p of productos) {
    const imgs = p.imagenes || [];
    const imgUrl = imgs.length > 0
      ? `https://iwbjzffwpijbeqyavtkd.supabase.co/storage/v1/object/public/productos/${imgs[0]}`
      : 'https://ruizpsm.com/favicon.png';

    const specs = p.especificaciones || {};
    let desc = specs.descripcion || p.nombre;
    if (specs.marca) desc += ` Marca: ${specs.marca}.`;
    if (specs.modelo) desc += ` Modelo: ${specs.modelo}.`;
    if (p.referencia) desc += ` Ref: ${p.referencia}.`;
    desc += ' Disponible en Ecuador. Cotiza por WhatsApp al +593969889751.';

    const categoria = p.categoria || 'Repuestos';
    const googleCat = categoria.toLowerCase().includes('maquinaria')
      ? '420' // Maquinaria industrial
      : '3546'; // Repuestos y accesorios

    const precio = parseFloat(p.precio_minimo || p.precio || 0).toFixed(2);

    items += `  <item>
    <g:id>${esc(p.id)}</g:id>
    <g:title><![CDATA[${p.nombre}]]></g:title>
    <g:description><![CDATA[${desc}]]></g:description>
    <g:link>https://ruizpsm.com/?producto=${esc(p.id)}</g:link>
    <g:image_link>${esc(imgUrl)}</g:image_link>
    <g:price>${precio} USD</g:price>
    <g:availability>in_stock</g:availability>
    <g:condition>new</g:condition>
    <g:brand><![CDATA[${specs.marca || 'Ruiz PSM'}]]></g:brand>
    <g:google_product_category>${googleCat}</g:google_product_category>
    <g:product_type><![CDATA[${categoria}]]></g:product_type>
    ${p.referencia ? `<g:mpn><![CDATA[${p.referencia}]]></g:mpn>` : ''}
    <g:identifier_exists>no</g:identifier_exists>
    <g:shipping>
      <g:country>EC</g:country>
      <g:service>Envío estándar</g:service>
      <g:price>0 USD</g:price>
    </g:shipping>
    <g:shipping>
      <g:country>US</g:country>
      <g:service>Envío internacional</g:service>
      <g:price>25 USD</g:price>
    </g:shipping>
  </item>\n`;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Ruiz PSM - Repuestos y Maquinaria Industrial Ecuador</title>
  <link>https://ruizpsm.com</link>
  <description>Proveedor de repuestos industriales, maquinaria y equipos en Ecuador.</description>
${items}
</channel>
</rss>`;

  fs.writeFileSync('feed.xml', xml, 'utf8');
  console.log(`feed.xml generado con ${productos.length} productos.`);
}

generateFeed().catch(console.error);
