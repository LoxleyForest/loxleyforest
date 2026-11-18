import ephem, json, math, datetime as dt
from zoneinfo import ZoneInfo
TZ=ZoneInfo('America/New_York'); UTC=dt.timezone.utc
LAT,LON,ELEV='34.5329','-83.9849',480
def obs(when_utc,horizon='0'):
    o=ephem.Observer(); o.lat,o.lon,o.elevation=LAT,LON,ELEV; o.date=when_utc.strftime('%Y/%m/%d %H:%M:%S'); o.horizon=horizon; o.pressure=1010; return o
def loc(e): return ephem.Date(e).datetime().replace(tzinfo=UTC).astimezone(TZ)
def hm(d): return d.strftime('%-I:%M %p') if d else None
mir=json.load(open('/home/mick/work/loxley-mirror/mirror.json')); nights={n['date']:n for n in mir['nights']}
out=[]; d=dt.date(2026,11,17)
while d<=dt.date(2027,3,13):
    noon=dt.datetime(d.year,d.month,d.day,12,tzinfo=TZ).astimezone(UTC)
    o=obs(noon,'-0:34'); sun=ephem.Sun(); sunset=loc(o.next_setting(sun))
    o2=obs(noon,'-18'); o2.pressure=0; dark=loc(o2.next_setting(sun,use_center=True))
    o3=obs(noon,'-6'); o3.pressure=0; civil=loc(o3.next_setting(sun,use_center=True))

    def cross(start_utc,deg,rising):
        oc=obs(start_utc,str(deg)); oc.pressure=0
        try: return loc(oc.next_rising(ephem.Sun(),use_center=True) if rising else oc.next_setting(ephem.Sun(),use_center=True))
        except Exception: return None
    ge_s=cross(noon,6,False); ge_e=cross(noon,-4,False); be_e=cross(noon,-6,False)
    mid=(dt.datetime(d.year,d.month,d.day,tzinfo=TZ)+dt.timedelta(days=1)).astimezone(UTC)
    mb_s=cross(mid,-6,True); mg_s=cross(mid,-4,True); mg_e=cross(mid,6,True)
    om2=obs(mid,'-0:34'); sunrise=loc(om2.next_rising(ephem.Sun()))
    moon=ephem.Moon(); hrs=[]
    for h in [16,17,18,19,20,21,22,23,24]:
        t=(dt.datetime(d.year,d.month,d.day,tzinfo=TZ)+dt.timedelta(hours=h)).astimezone(UTC)
        oo=obs(t); moon.compute(oo); s=ephem.Sun(); s.compute(oo)
        hrs.append([round(math.degrees(moon.alt),1),round(math.degrees(moon.az),0),round(math.degrees(s.alt),1)])
    t21=(dt.datetime(d.year,d.month,d.day,21,tzinfo=TZ)).astimezone(UTC); oo=obs(t21); moon.compute(oo)
    illum=round(moon.phase,0)
    # waxing if illumination rising
    m2=ephem.Moon(); m2.compute(obs(t21+dt.timedelta(hours=24))); waxing=m2.phase>moon.phase
    # moon rise/set within 3pm..next 9am
    start=dt.datetime(d.year,d.month,d.day,15,tzinfo=TZ).astimezone(UTC); om=obs(start,'-0:34')
    try: mr=loc(om.next_rising(ephem.Moon()))
    except Exception: mr=None
    try: ms=loc(om.next_setting(ephem.Moon()))
    except Exception: ms=None
    end=dt.datetime(d.year,d.month,d.day,15,tzinfo=TZ)+dt.timedelta(hours=18)
    mr=mr if mr and mr<end else None; ms=ms if ms and ms<end else None
    # darkness 8pm..11pm: samples index 3..6
    up=[1 if hrs[i][0]>0 else 0 for i in (4,5,6,7)]
    score=round(100*(1-(illum/100)*(sum(up)/4)))
    n=nights.get(d.isoformat())
    out.append({'d':d.isoformat(),'ss':hm(sunset),'ssm':sunset.hour*60+sunset.minute,'cv':hm(civil),'dk':hm(dark),'dkm':dark.hour*60+dark.minute,'il':int(illum),'wx':bool(waxing),'mr':hm(mr),'ms':hm(ms),'h':hrs,'sc':score,
                'gs':hm(ge_s),'gsm':ge_s.hour*60+ge_s.minute,'ge':hm(ge_e),'gem':ge_e.hour*60+ge_e.minute,'be':hm(be_e),'mb':hm(mb_s),'mg':hm(mg_s),'sr':hm(sunrise),'mge':hm(mg_e),'mrm':(mr.hour*60+mr.minute if mr and mr.date()==d else None),
                'st':n['state'] if n else None,'rate':n['rate_cents'] if n else None,'min':n['min_stay'] if n else None})
    d+=dt.timedelta(days=1)
json.dump({'asof':mir['generated_at'],'days':out},open('sky.json','w'),separators=(',',':'))
print(len(out), len(json.dumps(out)))
for x in out:
    if x['d'] in ('2026-11-17','2026-11-28','2026-12-13','2026-12-21','2026-12-24','2027-01-03'): print(x['d'],x['ss'],x['dk'],'illum',x['il'],'wax',x['wx'],'rise',x['mr'],'set',x['ms'],'score',x['sc'],x['st'],x['h'][4])
print('mirror nights span',min(nights),max(nights))
# new/full moons
dd=ephem.Date('2026/11/17'); 
for i in range(5):
    nm=ephem.next_new_moon(dd); print('new',loc(nm).strftime('%b %d')); fm=ephem.next_full_moon(dd); print('full',loc(fm).strftime('%b %d')); dd=ephem.Date(nm+1)
