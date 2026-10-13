# usage: outline.py font.ttf "text" size tracking_em x0 baseline  -> JSON glyph outlines (shaped with HarfBuzz, kerned)
import sys, json, uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
fp, text, size, track, x0, base = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), float(sys.argv[6])
blob = hb.Blob.from_file_path(fp); face = hb.Face(blob); font = hb.Font(face)
buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
hb.shape(font, buf, {"kern": True, "liga": False})
tt = TTFont(fp); gs = tt.getGlyphSet(); order = tt.getGlyphOrder(); upm = tt['head'].unitsPerEm
k = size / upm; x = x0; out = []
for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
    name = order[info.codepoint]; ch = text[info.cluster]
    pen = SVGPathPen(gs, ntos=lambda v: ('%.2f' % v).rstrip('0').rstrip('.'))
    tp = TransformPen(pen, (k, 0, 0, -k, x + pos.x_offset * k, base - pos.y_offset * k))
    gs[name].draw(tp)
    adv = pos.x_advance * k
    out.append({"ch": ch, "d": pen.getCommands(), "x": round(x, 2), "w": round(adv, 2)})
    x += adv + (0 if ch == ' ' else track * size)
width = x - x0 - track * size
os2 = tt['OS/2']
print(json.dumps({"glyphs": out, "width": round(width, 2), "xh": getattr(os2, 'sxHeight', 0) * k, "cap": getattr(os2, 'sCapHeight', 0) * k}))
