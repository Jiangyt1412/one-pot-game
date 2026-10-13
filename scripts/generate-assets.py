# Original vector food illustrations, drawn specifically for this project.
from pathlib import Path
root = Path(__file__).resolve().parents[1] / 'public' / 'assets' / 'items'
root.mkdir(parents=True, exist_ok=True)
def ellipse(cx,cy,rx,ry,fill,extra=''):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" {extra}/>'
def path(d,fill,extra=''):
    return f'<path d="{d}" fill="{fill}" {extra}/>'
def line(d,stroke='#b28a68',width=2.4):
    return path(d,'none',f'stroke="{stroke}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"')
def circle(x,y,r,c):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>'
art = {}
art['shrimp'] = path('M31 69C10 44 22 18 50 18C76 17 87 36 80 54C75 67 58 69 53 58C50 52 55 45 62 44C57 36 44 38 42 49C40 59 47 66 48 71Z','url(#coral)') + path('M31 64L14 73L19 60L8 59L25 49','url(#coral)') + line('M33 24L42 36M49 19L50 34M65 23L60 36M78 36L65 41M79 53L66 50','#c96552',3) + line('M32 29Q21 45 29 52','#ffd1ab',4) + circle(67,28,2.2,'#6d554a') + line('M70 26Q80 13 90 19','#b46652',1.4)
art['dumpling'] = path('M12 65Q16 25 48 27Q78 22 89 61Q85 81 52 81Q20 84 12 65Z','url(#cream)') + path('M15 63Q35 56 48 31Q58 50 85 60Q80 69 65 62Q55 72 47 63Q37 72 29 65Q21 71 15 63','url(#dough)') + line('M25 53L29 65M37 43L41 65M50 38L52 65M64 47L63 63M77 54L75 62','#cdb386',2) + line('M22 70Q47 82 77 70','#fff6d9',4)
art['broccoli'] = path('M37 48L62 47L68 82Q52 93 35 81Z','url(#stem)') + line('M50 55L50 81M51 68L38 59M52 68L66 57','#c4d697',4)
for x,y,r in [(28,45,16),(72,43,16),(38,26,16),(58,24,17),(50,43,21)]:
    art['broccoli'] += circle(x,y,r,'url(#green)') + ellipse(x-4,y-5,r*.5,r*.23,'#a7c98a', 'opacity=".7"')
art['broccoli'] += ''.join(circle(x,y,2,'#5e925b') for x,y in [(23,49),(32,38),(42,23),(52,35),(59,17),(65,49),(76,37),(46,47)])
art['chicken'] = path('M64 60L79 78Q94 72 93 85Q91 95 83 89Q75 96 72 85L57 71Z','url(#cream)') + path('M23 25C46 11 75 33 71 57C69 74 47 85 31 69C17 62 11 37 23 25Z','url(#roast)') + ellipse(33,34,10,6,'#e8b679','transform="rotate(-35 33 34)"') + line('M25 46Q30 66 44 66','#9e6844',3) + circle(52,40,2.5,'#b07748') + circle(59,49,2,'#b07748')
art['mushroom'] = path('M39 52L60 54L67 83Q54 93 36 84Z','url(#cream)') + ellipse(50,59,37,16,'#bc987c') + path('M12 55Q14 12 52 16Q86 18 88 55Q78 70 50 62Q23 70 12 55Z','url(#brown)') + line('M29 32Q39 20 51 23','#d7b592',4) + line('M38 42L59 34M48 32L51 48','#f5ddba',4) + line('M43 68L43 83','#cdb899',2)
art['cabbage'] = path('M34 86L20 58Q12 39 26 26Q36 10 48 25Q62 6 76 27Q91 32 79 54L66 84Q49 93 34 86Z','url(#palegreen)') + path('M34 81Q39 54 29 40Q46 38 50 64Q53 35 73 36Q58 54 64 81Q49 89 34 81Z','url(#cream)') + line('M50 41L50 80M29 31L37 47M72 27L62 46','#91ae71',2.4) + line('M42 58L45 80M59 59L57 81','#d8d2a8',2)
art['corn'] = path('M27 78Q14 53 26 32L66 29Q86 48 71 77Q50 91 27 78Z','url(#yellow)')
for y in range(32,76,10):
    for x in range(29,69,10): art['corn'] += f'<rect x="{x}" y="{y}" width="8" height="8" rx="3" fill="#f9d781" stroke="#d7a54d" stroke-width=".7"/>'
art['corn'] += path('M26 79Q2 58 14 38Q20 63 38 80Z','url(#green)') + path('M57 84Q79 66 86 38Q97 72 67 87Z','url(#stem)')
art['tofu'] = path('M16 35L62 21L85 40L83 73L40 87L17 66Z','url(#dough)') + path('M17 35L40 53L85 40L62 21Z','url(#cream)') + path('M40 53L85 40L83 73L40 87Z','#e8cf9f') + line('M40 55L40 84','#c9ae82',1.5) + ''.join(circle(x,y,1.5,'#c9b38b') for x,y in [(54,63),(73,52),(49,76),(70,69),(32,60),(25,48)]) + line('M27 34L56 25','#fff9df',3)
art['crab'] = path('M21 29L62 17L83 69L42 86Z','url(#coral)') + path('M23 31L63 22L79 69L41 81Z','url(#cream)') + path('M25 31L34 28L53 76L43 81Z','#df836e') + path('M48 23L59 20L78 68L67 73Z','#e99c84') + line('M40 29L57 73','#d3b794',1.5)
art['fishball'] = ellipse(49,59,33,30,'url(#cream)') + ellipse(38,45,13,8,'#fff7df') + ellipse(58,69,18,10,'#d1c3a1','opacity=".4"') + ''.join(circle(x,y,1.4,'#c8ba96') for x,y in [(42,66),(59,41),(70,58),(33,50),(56,56)])
art['beef'] = path('M14 39L64 19L86 39L81 70L30 86L14 66Z','url(#beef)') + ellipse(32,61,20,25,'#dbb0a0','transform="rotate(-21 32 61)"') + path('M22 41Q52 47 43 71Q32 87 22 69Q15 53 28 50Q40 48 38 63Q36 72 30 67','none','stroke="#a36863" stroke-width="7" stroke-linecap="round"') + line('M46 40L71 30M52 55L81 45M54 72L79 61','#efc6b4',3)
art['lotus'] = ellipse(49,57,37,31,'url(#dough)') + ellipse(49,51,36,30,'url(#cream)')
for x,y,rx,ry in [(49,50,7,8),(30,35,6,8),(49,30,5,7),(68,38,6,8),(70,56,6,7),(51,70,5,7),(29,59,6,8)]: art['lotus'] += ellipse(x,y,rx,ry,'#b39673') + ellipse(x,y-1,rx*.75,ry*.75,'#c5ab86')
art['carrot'] = path('M66 28Q76 33 70 48L32 85Q18 91 25 75L43 31Z','url(#orange)') + path('M49 31Q38 16 48 13Q58 17 60 26Q59 9 70 12Q77 21 66 31Q84 17 87 27Q84 38 69 35Z','url(#green)') + line('M43 51L53 57M34 66L42 70M55 38L65 43','#bf824a',2.2) + line('M49 36L31 73','#f5c187',3)
art['egg'] = path('M12 54Q7 27 33 28Q42 13 60 26Q83 19 88 43Q99 57 80 71Q79 86 58 82Q34 94 24 77Q8 75 12 54Z','url(#cream)') + ellipse(50,53,22,21,'url(#yellow)') + ellipse(43,47,10,6,'#ffe5a6') + line('M23 39Q15 49 20 59','#fffdf3',3)
art['wonton'] = path('M11 35L39 23Q50 8 65 29L90 41L70 64L59 86L35 76L20 61Z','url(#cream)') + path('M27 38Q48 30 64 37L69 60Q48 79 31 61Z','url(#dough)') + line('M25 37L34 60Q50 73 69 59M42 28L49 41M73 42L67 57','#c8ae81',2.5) + line('M17 36L29 40M53 79L58 70','#fff7da',3)
art['lettuce'] = path('M43 85Q17 78 24 62Q6 51 21 41Q13 22 31 22Q33 8 49 20Q69 8 72 28Q93 26 82 48Q94 65 75 69Q75 88 57 82Z','url(#palegreen)') + line('M50 31L50 78M50 57L31 39M50 64L72 44M49 70L33 62','#dae6b4',3) + line('M27 31Q22 36 28 42M66 27Q73 27 72 35','#c4dba2',3)
art['siu-mai'] = path('M22 35L33 27L43 33L54 25L64 31L77 26L84 49L76 78Q51 93 26 77Z','url(#dough)') + ellipse(52,38,30,14,'#a98666') + ellipse(52,38,21,9,'#c9a573') + ''.join(circle(x,y,3,'#eabb63') for x,y in [(44,32),(51,37),(58,32),(63,39),(46,41)]) + line('M26 48L30 70M39 51L41 79M58 52L58 80M76 48L70 74','#c0a16f',2.5) + line('M33 50L36 69','#f9e7b8',3)
art['bun'] = ellipse(50,57,38,31,'url(#cream)') + path('M19 46Q31 26 49 26Q71 24 82 46Q70 48 62 38Q62 50 51 43Q40 53 37 41Q29 49 19 46Z','url(#dough)') + line('M31 36L47 46M51 28L51 44M70 35L55 45','#c6ad82',2.5) + line('M23 59Q28 76 42 78','#fff7e0',4)
art['strawberry'] = path('M20 35Q12 58 42 86Q51 97 64 84Q92 59 80 35Q59 22 49 31Q33 21 20 35Z','url(#berry)') + path('M18 30L36 29L31 18L47 24L54 12L58 28L78 25L68 38L81 43L59 43L47 52L42 40L23 43L31 34Z','url(#green)') + ''.join(ellipse(x,y,1.8,3,'#ffe0a4',f'transform="rotate(20 {x} {y})"') for x,y in [(30,48),(44,57),(61,51),(72,44),(27,60),(38,70),(52,76),(66,65)]) + line('M26 43Q19 56 29 65','#f4afa0',3)
art['orange'] = ellipse(50,55,36,34,'url(#orange)') + path('M50 23Q54 7 78 16Q73 31 53 29Z','url(#green)') + line('M50 27L49 19','#8b8961',3) + ellipse(35,40,9,6,'#f9d49d','transform="rotate(-25 35 40)"') + ''.join(circle(x,y,1,'#ce954d') for x,y in [(38,67),(46,70),(55,62),(66,68),(72,51),(30,54)])
art['watermelon'] = path('M15 28L86 34Q88 77 48 90Q13 72 15 28Z','url(#green)') + path('M20 31L81 36Q79 71 48 83Q19 68 20 31Z','url(#cream)') + path('M25 33L77 37Q76 65 49 77Q26 64 25 33Z','url(#berry)') + ''.join(ellipse(x,y,2,4,'#765848',f'transform="rotate({a} {x} {y})"') for x,y,a in [(34,46,-30),(51,45,0),(66,47,25),(43,60,-20),(58,61,20)])
art['cake'] = path('M14 39L63 24L87 46L83 78L38 89L15 70Z','url(#cream)') + path('M15 50L39 65L85 52L84 62L39 76L15 62Z','#b58866') + path('M14 39L39 56L87 43L63 24Z','url(#pink)') + path('M14 39L14 47Q23 58 28 49Q35 64 43 54L87 43L87 50Q77 59 74 51L44 61Q33 69 28 58Q16 62 14 48Z','#e9b6a4') + ellipse(51,33,10,10,'url(#berry)') + path('M45 24L51 16L54 23L61 20L59 27Z','url(#green)') + line('M23 68L32 74','#fff6dd',3)
art['donut'] = ellipse(50,58,38,30,'url(#roast)') + path('M13 48Q18 17 52 23Q88 26 87 52Q80 65 70 58Q58 77 45 64Q30 69 26 58Q13 64 13 48Z','url(#pink)') + ellipse(51,48,13,10,'#9d7756') + ellipse(51,45,10,6,'#f5e5c9') + ''.join(line(f'M{x} {y}l{dx} {dy}',c,2.5) for x,y,dx,dy,c in [(24,39,5,2,'#f7dd9b'),(36,31,2,5,'#fff0da'),(64,34,5,-2,'#99b185'),(75,47,2,5,'#f8e1a7'),(59,60,-4,2,'#fdf0d8'),(31,53,4,2,'#aac2a0')])
# Crisp 512px vector raster sources, vivid candy gradients, sticker outlines and expressive faces.
import re
import colorsys
face_positions = {
    'shrimp':(51,29),'dumpling':(50,66),'broccoli':(51,43),'chicken':(42,50),
    'mushroom':(52,49),'cabbage':(50,64),'corn':(50,62),'tofu':(61,65),
    'crab':(54,53),'fishball':(50,61),'beef':(31,63),'lotus':(49,52),
    'carrot':(45,60),'egg':(50,53),'wonton':(50,55),'lettuce':(50,54),
    'siu-mai':(51,65),'bun':(50,63),'strawberry':(51,58),'orange':(50,57),
    'watermelon':(49,59),'cake':(59,70),'donut':(51,69),
}
def vivid(match):
    raw=match.group(0)
    r,g,b=(int(raw[i:i+2],16)/255 for i in (1,3,5))
    h,l,sat=colorsys.rgb_to_hls(r,g,b)
    if l<.46:
        l=max(.25,l*.94)
    sat=min(.96,max(.42,sat*1.45))
    r,g,b=colorsys.hls_to_rgb(h,l,sat)
    return '#'+''.join(f'{round(c*255):02x}' for c in (r,g,b))
def face(x,y,index):
    dark='#392641'
    eyes=circle(x-6,y,2.7,dark)+circle(x-6.7,y-.9,.8,'#ffffff')
    if index%4==0:
        eyes+=line(f'M{x+3} {y}q3 -4 6 0',dark,2.5)
    else:
        eyes+=circle(x+6,y,2.7,dark)+circle(x+5.3,y-.9,.8,'#ffffff')
    cheeks=ellipse(x-12,y+5,3.6,2.3,'#ff83ad')+ellipse(x+12,y+5,3.6,2.3,'#ff83ad')
    smile=line(f'M{x-3} {y+5}q3 5 6 0',dark,1.8)
    return f'<g stroke="none">{cheeks}{eyes}{smile}</g>'
def svg(body,name,index):
    gradients = [('cream','#fffef5','#ffdb9c'),('dough','#fff2ac','#ffc54b'),('coral','#ffb980','#ff654f'),('green','#9aff66','#27c85f'),('stem','#d8ff8c','#81d039'),('palegreen','#d7ff8e','#4bd86d'),('roast','#ffc258','#f48938'),('brown','#fdb45c','#c86640'),('yellow','#fff49c','#ffcf17'),('orange','#ffd668','#ff8e20'),('beef','#ffb0bd','#f45776'),('berry','#ff8da8','#f34275'),('pink','#ffc9ed','#ff70b7')]
    defs=''.join(f'<linearGradient id="{n}" x1="0%" y1="0%" x2="80%" y2="100%"><stop stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>' for n,a,b in gradients)
    body=re.sub(r'#[0-9a-fA-F]{6}',vivid,body)
    x,y=face_positions[name]
    outline='<filter id="sticker" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="1.4" result="edge"/><feFlood flood-color="#fffdf7"/><feComposite in2="edge" operator="in" result="border"/><feMerge><feMergeNode in="border"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="4 6 92 92"><defs>{defs}{outline}</defs><g filter="url(#sticker)" stroke="#75413b" stroke-width="1.7" stroke-linejoin="round" paint-order="stroke fill">{body}{face(x,y,index)}</g></svg>'
for index,(name,body) in enumerate(art.items()):
    (root / (name+'.svg')).write_text(svg(body,name,index))
icon='<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 100 100"><rect width="100" height="100" rx="25" fill="#f5e6ce"/><rect x="5" y="46" width="90" height="17" rx="8" fill="#38413a"/><ellipse cx="50" cy="55" rx="37" ry="33" fill="#616a60"/><ellipse cx="50" cy="52" rx="30" ry="27" fill="#33392c"/><path d="M27 61Q27 36 46 39Q64 36 70 58Q59 73 44 70Q31 74 27 61Z" fill="#fff3bc"/><path d="M34 51L42 63M48 43L49 63M60 49L57 63" stroke="#c0873a" stroke-width="3" stroke-linecap="round"/><path d="M37 17Q28 10 38 4M57 18Q48 11 58 5" fill="none" stroke="#fffdf7" stroke-width="3" stroke-linecap="round"/></svg>'
(root.parent/'icon.svg').write_text(icon)
print(f'Created {len(art)} original transparent SVG foods and an app icon.')
