import {inputs} from './variables.mjs'
import {lsin,lcos} from './graphics.mjs'
//calculatory
export function floor(value){
    return Math.floor(value)
}
export function ceil(value){
    return Math.ceil(value)
}
export function random(min,max){
    return Math.random()*(max-min)+min
}
export function round(value){
    return Math.round(value)
}
export function max(value1,value2){
    return Math.max(value1,value2)
}
export function min(value1,value2){
    return Math.min(value1,value2)
}
export function constrain(value,lower,upper){
    return Math.min(Math.max(value,lower),upper)
}
export function dist(x1,y1,x2,y2){
    return Math.sqrt((x1-x2)**2+(y1-y2)**2)
}
export function distPos(p1,p2){
	return dist(p1.position.x,p1.position.y,p2.position.x,p2.position.y)
}
export function dirPos(p1,p2){
	return atan2(p2.position.x-p1.position.x,p2.position.y-p1.position.y)
}
export function magVec(vec){
	return sqrt(vec.x**2+vec.y**2)
}
export function near(value1,value2){
	return abs(value1-value2)<1
}
export function pl(value){
	return value!=1?`s`:``
}
export function spinControl(base){
	return base<-180?base+360:base>180?base-360:base
}
export function spinDirection(base,goal,speed){
	if(
		abs(base-goal)<speed||
		abs(base-goal-360)<speed||
		abs(base-goal+360)<speed
	){
		return goal
	}else if(
		base>goal-540&&base<goal-360||
		base>goal-180&&base<goal||
		base>goal+180&&base<goal+360
	){
		return base+speed
	}else if(
		base>goal-360&&base<goal-180||
		base>goal&&base<goal+180||
		base>goal+360&&base<goal+540
	){
		return base-speed
	}
	return base+speed*(floor(random(0,2))*2-1)
}
export function moveToward(base,goal,speed){
    if(abs(base-goal)<speed){
        return goal
    }else if(base<goal){
        return base-speed
    }else{
        return base+speed
    }
}
export function moveTowardVec(base,goal,speed){
    if(distPos(base,goal)<speed){
        return {x:goal.position.x,y:goal.position.y}
    }else{
        let dir=dirPos(base,goal)
        return {x:base.position.x+lsin(dir)*speed,y:base.position.y+lcos(dir)*speed}
    }
}
export function moveTowardVecDynamic(base,goal,baseSpeed,speedMult){
    let dp=distPos(base,goal)
    let speed=baseSpeed+speedMult*dp
    if(dp<speed){
        return {x:goal.position.x,y:goal.position.y}
    }else{
        let dir=dirPos(base,goal)
        return {x:base.position.x+lsin(dir)*speed,y:base.position.y+lcos(dir)*speed}
    }
}
export function smoothAnim(anim,trigger,minPoint,maxPoint,speed){
	if(trigger&&anim<maxPoint){
		return min(round(anim*speed+1)/speed,maxPoint)
	}
	if(!trigger&&anim>minPoint){
		return max(round(anim*speed-1)/speed,minPoint)
	}
	return anim
}
export function mapVec(vec1,vec2,interp){
    return {x:vec1.x*(1-interp)+vec2.x*interp,y:vec1.y*(1-interp)+vec2.y*interp}
}
export function elementArray(base,number){
	let result=[]
	for(let a=0,la=number;a<la;a++){
		result.push(base)
	}
	return result
}
export function range(start,end){
    return [...Array(end-start).keys()].map(a=>a+start)
}
export function even(pos,total){
    return pos-total*0.5+0.5
}
export function formatTime(frames){
    return `${floor(frames/3600)%60}:${floor(frames/60)%60<10?`0`:``}${floor(frames/60)%60}`
}
export function shuffleArray(array){
    for(let a=0,la=array.length-1;a<la;a++){
        let selector=floor(random(a,la+1))
        if(a!=la){
            let temp=array[a]
            array[a]=array[selector]
            array[selector]=temp
        }
    }
    return array
}
export function randin(array){
    return array[floor(random(0,array.length))]
}
export function randindex(array){
    return floor(random(0,array.length))
}
export function last(array){
    return array[array.length-1]
}
export function lastKey(array,key){
    return array[array.length-key]
}
export function numLength(num){
    let value=num
    let len=1
    while(value>=10){
        value=floor(value/10)
        len++
    }
    return len
}
export function findList(item,list){
	for(let a=0,la=list.length;a<la;a++){
		if(list[a]==item){
			return a
		}
	}
    throw new Error(`findList Fail: ${item}`)
	return -1
}
export function findName(name,list){
	for(let a=0,la=list.length;a<la;a++){
		if(list[a].name==name){
			return a
		}
	}
    throw new Error(`findName Fail: ${name}`)
	return -1
}
export function findId(id,list){
	for(let a=0,la=list.length;a<la;a++){
		if(list[a].id==id){
			return a
		}
	}
    throw new Error(`findId Fail: ${id}`)
	return -1
}
export function findName2(name,list){
	for(let a=0,la=list.length;a<la;a++){
		if(
            list[a].name[0]==name[0]&&
            list[a].name[1]==name[1]
        ){
			return a
		}
	}
    throw new Error(`findName2 Fail: ${name}`)
	return -1
}
export function findTerm(term,list){
	for(let a=0,la=list.length;a<la;a++){
		if(list[a].term==term){
			return a
		}
	}
    throw new Error(`findTerm Fail: ${term}`)
	return -1
}
export function findTerm0(term,list){
	for(let a=0,la=list.length;a<la;a++){
		if(list[a].term[0]==term[0]){
			return a
		}
	}
    throw new Error(`findTerm0 Fail: ${term}`)
	return -1
}
export function updateMouse(layer,scale){
    inputs.mouse.previous.base.x=inputs.mouse.base.x
    inputs.mouse.previous.base.y=inputs.mouse.base.y
    inputs.mouse.previous.rel.x=inputs.mouse.rel.x
    inputs.mouse.previous.rel.y=inputs.mouse.rel.y
	inputs.mouse.base.x=mouseX
	inputs.mouse.base.y=mouseY
	inputs.mouse.rel.x=(inputs.mouse.base.x-width/2)/scale+layer.width/2
	inputs.mouse.rel.y=(inputs.mouse.base.y-height/2)/scale+layer.height/2
}
//operational
export function boxify(x,y,width,height){
	return {position:{x:x,y:y},width:width,height:height}
}
export function onSegment(p,q,r){ 
    return q.x<=max(p.x,r.x)&&q.x>=min(p.x, r.x)&&q.y<=max(p.y,r.y)&&q.y>=min(p.y, r.y)
}
export function orientPoint(p,q,r){ 
    s=(q.y-p.y)*(r.x-q.x)-(q.x-p.x)*(r.y-q.y) 
    return s==0?0:s>0?1:2
}
export function intersect(p1,q1,p2,q2){
    o1=orientPoint(p1,q1,p2)
    o2=orientPoint(p1,q1,q2)
    o3=orientPoint(p2,q2,p1)
    o4=orientPoint(p2,q2,q1)
    return o1!=o2&&o3!=o4||
    o1==0&&onSegment(p1,p2,q1)||
    o2==0&&onSegment(p1,q2,q1)||
    o3==0&&onSegment(p2,p1,q2)||
    o4==0&&onSegment(p2,q1,q2)
}
export function intersectKey(p1,q1,p2,q2){
    let ud=((q2.y-p2.y)*(q1.x-p1.x)-(q2.x-p2.x)*(q1.y-p1.y))
    let ua=((q2.x-p2.x)*(p1.y-p2.y)-(q2.y-p2.y)*(p1.x-p2.x))/ud
    return {x:p1.x+ua*(q1.x-p1.x),y:p1.y+ua*(q1.y-p1.y)}
}
export function inPointBox(point,box){
    return point.position.x>box.position.x-box.width/2&&point.position.x<box.position.x+box.width/2&&point.position.y>box.position.y-box.height/2&&point.position.y<box.position.y+box.height/2
}
export function inCircleBox(circle,box){
    return dist(circle.position.x,circle.position.y,constrain(circle.position.x,box.position.x-box.width/2,box.position.x+box.width/2),constrain(circle.position.y,box.position.y-box.height/2,box.position.y+box.height/2))<circle.radius
}
export function inBoxBox(box1,box2){
    return box1.position.x>box2.position.x-box1.width/2-box2.width/2&&box1.position.x<box2.position.x+box1.width/2+box2.width/2&&box1.position.y>box2.position.y-box1.height/2-box2.height/2&&box1.position.y<box2.position.y+box1.height/2+box2.height/2
}
export function basicCollideBoxBox(nonmobile,mobile){
    return abs(nonmobile.position.y-mobile.position.y)/abs(nonmobile.position.x-mobile.position.x)>(nonmobile.height+mobile.height)/(nonmobile.width+mobile.width)?(mobile.position.y>nonmobile.position.y?0:1):(mobile.position.x>nonmobile.position.x?2:3)
}
export function collideBoxBox(nonmobile,mobile){
    for(let a=0,la=nonmobile.boundary.length;a<la;a++){
        for(let b=0,lb=nonmobile.boundary[a].length;b<lb;b++){
            if(a<=3){
                if(intersect(mobile.position,{x:mobile.previous.position.x+nonmobile.velocity.x,y:mobile.previous.position.y+nonmobile.velocity.y},
                    {x:nonmobile.boundary[a][b][0].x+mobile.width/2*(a==2?1:-1),y:nonmobile.boundary[a][b][0].y+mobile.height/2*(a==0?1:-1)},
                    {x:nonmobile.boundary[a][b][1].x+mobile.width/2*(a!=3?1:-1),y:nonmobile.boundary[a][b][1].y+mobile.height/2*(a!=1?1:-1)})
                ){
                    return a
                }
            }else if(a==4){
                if(
                    intersect(mobile.position,{x:mobile.previous.position.x+nonmobile.velocity.x,y:mobile.previous.position.y+nonmobile.velocity.y},
                    {x:nonmobile.boundary[a][b][0].x+mobile.width/2,y:nonmobile.boundary[a][b][0].y-mobile.height/2},
                    {x:nonmobile.boundary[a][b][1].x+mobile.width/2,y:nonmobile.boundary[a][b][1].y-mobile.height/2})||
                    intersect(mobile.position,{x:mobile.previous.position.x+nonmobile.velocity.x,y:mobile.previous.position.y+nonmobile.velocity.y},
                    {x:nonmobile.boundary[a][b][0].x-mobile.width/2,y:nonmobile.boundary[a][b][0].y-mobile.height/2},
                    {x:nonmobile.boundary[a][b][0].x+mobile.width/2,y:nonmobile.boundary[a][b][0].y-mobile.height/2})
                ){
                    return a
                }else if(
                    intersect(mobile.position,{x:mobile.previous.position.x+nonmobile.velocity.x,y:mobile.previous.position.y+nonmobile.velocity.y},
                    {x:nonmobile.boundary[a][b][1].x+mobile.width/2,y:nonmobile.boundary[a][b][1].y-mobile.height/2},
                    {x:nonmobile.boundary[a][b][1].x+mobile.width/2,y:nonmobile.boundary[a][b][1].y+mobile.height/2})
                ){
                    return 8
                }
            }else if(a==5){
                if(
                    intersect(mobile.position,{x:mobile.previous.position.x+nonmobile.velocity.x,y:mobile.previous.position.y+nonmobile.velocity.y},
                    {x:nonmobile.boundary[a][b][0].x-mobile.width/2,y:nonmobile.boundary[a][b][0].y-mobile.height/2},
                    {x:nonmobile.boundary[a][b][1].x-mobile.width/2,y:nonmobile.boundary[a][b][1].y-mobile.height/2})||
                    intersect(mobile.position,{x:mobile.previous.position.x+nonmobile.velocity.x,y:mobile.previous.position.y+nonmobile.velocity.y},
                    {x:nonmobile.boundary[a][b][0].x-mobile.width/2,y:nonmobile.boundary[a][b][0].y-mobile.height/2},
                    {x:nonmobile.boundary[a][b][0].x+mobile.width/2,y:nonmobile.boundary[a][b][0].y-mobile.height/2})
                ){
                    return a
                }else if(
                    intersect(mobile.position,{x:mobile.previous.position.x+nonmobile.velocity.x,y:mobile.previous.position.y+nonmobile.velocity.y},
                    {x:nonmobile.boundary[a][b][1].x-mobile.width/2,y:nonmobile.boundary[a][b][1].y-mobile.height/2},
                    {x:nonmobile.boundary[a][b][1].x-mobile.width/2,y:nonmobile.boundary[a][b][1].y+mobile.height/2})
                ){
                    return 9
                }
            }else if(a==6){
                if(
                    intersect(mobile.position,{x:mobile.previous.position.x+nonmobile.velocity.x,y:mobile.previous.position.y+nonmobile.velocity.y},
                    {x:nonmobile.boundary[a][b][0].x-mobile.width/2,y:nonmobile.boundary[a][b][0].y+mobile.height/2},
                    {x:nonmobile.boundary[a][b][1].x-mobile.width/2,y:nonmobile.boundary[a][b][1].y+mobile.height/2})||
                    intersect(mobile.position,{x:mobile.previous.position.x+nonmobile.velocity.x,y:mobile.previous.position.y+nonmobile.velocity.y},
                    {x:nonmobile.boundary[a][b][0].x+mobile.width/2,y:nonmobile.boundary[a][b][0].y+mobile.height/2},
                    {x:nonmobile.boundary[a][b][0].x-mobile.width/2,y:nonmobile.boundary[a][b][0].y+mobile.height/2})
                ){
                    return a
                }else if(
                    intersect(mobile.position,{x:mobile.previous.position.x+nonmobile.velocity.x,y:mobile.previous.position.y+nonmobile.velocity.y},
                    {x:nonmobile.boundary[a][b][1].x-mobile.width/2,y:nonmobile.boundary[a][b][1].y+mobile.height/2},
                    {x:nonmobile.boundary[a][b][1].x-mobile.width/2,y:nonmobile.boundary[a][b][1].y-mobile.height/2})
                ){
                    return 10
                }
            }else if(a==7){
                if(
                    intersect(mobile.position,{x:mobile.previous.position.x+nonmobile.velocity.x,y:mobile.previous.position.y+nonmobile.velocity.y},
                    {x:nonmobile.boundary[a][b][0].x+mobile.width/2,y:nonmobile.boundary[a][b][0].y+mobile.height/2},
                    {x:nonmobile.boundary[a][b][1].x+mobile.width/2,y:nonmobile.boundary[a][b][1].y+mobile.height/2})||
                    intersect(mobile.position,{x:mobile.previous.position.x+nonmobile.velocity.x,y:mobile.previous.position.y+nonmobile.velocity.y},
                    {x:nonmobile.boundary[a][b][0].x+mobile.width/2,y:nonmobile.boundary[a][b][0].y+mobile.height/2},
                    {x:nonmobile.boundary[a][b][0].x-mobile.width/2,y:nonmobile.boundary[a][b][0].y+mobile.height/2})
                ){
                    return a
                }else if(
                    intersect(mobile.position,{x:mobile.previous.position.x+nonmobile.velocity.x,y:mobile.previous.position.y+nonmobile.velocity.y},
                    {x:nonmobile.boundary[a][b][1].x+mobile.width/2,y:nonmobile.boundary[a][b][1].y+mobile.height/2},
                    {x:nonmobile.boundary[a][b][1].x+mobile.width/2,y:nonmobile.boundary[a][b][1].y-mobile.height/2})
                ){
                    return 11
                }
            }
        }
    }
    return -1
}
//mark graphic
export function diamond(layer,x,y,width,height,direction){
	layer.quad(x-width*lcos(direction),y-width*lsin(direction),x-height*lsin(direction),y-height*lcos(direction),x+width*lcos(direction),y+width*lsin(direction),x+height*lsin(direction),y+height*lcos(direction))
}
export function pentagon(layer,x1,y1,x2,y2,x3,y3,x4,y4,x5,y5){
	layer.beginShape()
	layer.vertex(x1,y1)
	layer.vertex(x2,y2)
	layer.vertex(x3,y3)
	layer.vertex(x4,y4)
	layer.vertex(x5,y5)
	layer.endShape(CLOSE)
}
export function regTriangle(layer,x,y,radiusX,radiusY,direction){
	layer.triangle(x+lsin(direction)*radiusX,y+lcos(direction)*radiusY,x+lsin(direction+120)*radiusX,y+lcos(direction+120)*radiusY,x+lsin(direction+240)*radiusX,y+lcos(direction+240)*radiusY)
}
export function regPoly(layer,x,y,sides,radiusX,radiusY,direction){
	layer.beginShape()
	for(a=0,la=sides;a<la;a++){
		layer.vertex(x+lsin(direction+360*a/la)*radiusX,y+lcos(direction+360*a/la)*radiusY)
	}
	layer.endShape(CLOSE)
}
export function regPolyOpen(layer,x,y,sides,radiusX,radiusY,direction){
	layer.beginShape()
	for(a=0,la=sides;a<la;a++){
		layer.vertex(x+lsin(direction+360*a/la)*radiusX,y+lcos(direction+360*a/la)*radiusY)
	}
	layer.endShape()
}
export function regStar(layer,x,y,sides,radiusX,radiusY,direction){
	layer.beginShape()
	for(a=0,la=sides*2;a<la;a++){
		layer.vertex(x+lsin(direction+360*a/la)*radiusX[a%2],y+lcos(direction+360*a/la)*radiusY[a%2])
	}
	layer.endShape(CLOSE)
}
export function upColor(color,value,key){
	return [color[0]+value*key[0],color[1]+value*key[1],color[2]+value*key[2]]
}
export function mergeColor(color1,color2,value){
	return [color1[0]*(1-value)+color2[0]*value,color1[1]*(1-value)+color2[1]*value,color1[2]*(1-value)+color2[2]*value]
}
export function nameColor(name){
    switch(name){
        case `Barcelona`: case `Provence`: case `Lower Burgundy`: case `Auvergne`: case `Babenberg`: case `Herse`:
            return [218,106,81]
        case `Andechs`: case `Saône`: case `Franche-Comté`: case `Upper Burgundy`: case `Feuchtwangen`: case `Milly`:
            return [156,142,199]
        case `Hohenzollern`: case `Šurborgs`:
            return [110,148,204]
        case `Thoire`: case `Île-de-Bourgogne`: case `Kőszegi`: case `Biron`: case `Rethel`:
            return [1206,60,131]
        case `Sabran`: case `Forcalquier`: case `Leuven`:
            return [150,114,229]
        case `Knights`:
            return [194,154,183]
        case `Lillebonne`:
            return [160,65,72]
        case `Württemberg`: case `Montfaucon`:
            return [196,154,39]
        case `Arduinici`: case `Bresse`: case `Arenberg`:
            return [206,165,158]
        case `Lorraine`: case `Haut-Lorraine`: case `Kettler`: case `Ibelin`:
            return [229,152,152]
        case `Albon`: case `Cisjurania`: case `Dauphiné`: case `Bellingshausen`: case `Fauquembergues`: case `Elder Albon`:
            return [228,153,70]
        case `Rouergue`: case `Drôme`: case `Ascania`: case `Dampierre`:
            return [128,159,112]
        case `Zähringen`: case `Transjurania`: case `Helvetie`: case `Wettin`: case `Vermandois`:
            return [221,119,156]
        case `Republic`: case `Tellgovie`: case `Schwyz`: case `Hesse`: case `Unterwalden`: case `Obwalden`:
            return [161,161,161]
        case `Valais`: case `Winterstätten`:
            return [207,207,206]
        case `Two Leagues`: case `Three Leagues`:
            return [190,190,175]
        case `Habsburg`: case `Junior Habsburg`:
            return [229,173,67]
        case `Elder Habsburg`:
            return [235,193,75]
        case `Savoy`: case `Alpes`: case `Elder Savoy`:
            return [49,167,185]
        case `Romandie`: case `Junior Savoy`:
            return [108,173,184]
        case `Minor`:
            return [220,201,166]
        case `Burghers`: case `Alsace`: case `League of Cities`: case `Cheb`: case `Riga`: case `Geneva`: case `Lyon`: case `Besançon`:
            return [218,24,30]
        case `Geneva`:
            return [225,44,83]
        case `Lyon`:
            return [238,77,37]
        case `Besançon`:
            return [245,31,50]
        case `Ecclesiastical`: case `Bishop of Ösel-Wiek`: case `Bishop of Dorpat`: case `Bishop of Courland`: case `Archbishop of Besançon`: case `Archbishop of Vienne`: case `Archbishop of Arles`:
            return [162,88,172]
        case `La Marck-Arenberg`:
            return [41,150,163]
        case `Isenberg`:
            return [254,135,133]
        case `Gruyères`:
            return [193,144,112]
        case `Free Company`:
            return [228,77,21]
        case `Royal Army`:
            return [0,19,127]
        case `Imperial Army`:
            return [255,204,0]
        case `Bibra`:
            return [188,142,186]
        case `Elder Wittelsbach`: case `Rassburg`:
            return [103,172,140]
        case `Junior Wittelsbach`: case `Wittelsbach`:
            return [175,233,198]
        case `Wiemken`:
            return [157,172,147]
        case `Niklot`:
            return [239,177,90]
        case `Avesnes`:
            return [253,235,151]
        case `Welf`:
            return [244,185,127]
        case `Baden`:
            return [243,174,111]
        case `Přemyslid`: case `Elder Přemyslid`: case `Luxemburg`:
            return [198,149,110]
        case `Junior Přemyslid`:
            return [237,178,110]
        case `Nassau`:
            return [97,112,87]
        case `Kyburg`:
            return [167,188,19]
        case `Toggenburg`:
            return [32,181,40]
        case `Wassenberg`: case `Csák`:
            return [110,161,185]
        case `Friesland`: case `Vogtland`:
            return [254,171,78]
        case `Harcourt`: case `Ludovingian`:
            return [255,190,206]
        case `Piast`: case `Elder Piast`:
            return [251,94,140]
        case `Junior Piast`:
            return [203,131,175]
        case `Middle Piast`: case `Ivrea`:
            return [231,125,221]
        case `Leventina`:
            return [165,237,131]
        case `Russian Raid`:
            return [0,114,11]
        case `Archbishop of Riga`:
            return [112,69,134]
        case `Táborites`:
            return [240,144,69]
        case `Ziegenhain`:
            return [110,161,185]
        case `Hierges`:
            return [128,196,178]
        case `Cordano`:
            return [81,165,97]
        case `Junior Albon`:
            return [255,150,128]
        case `Orange`:
            return [238,110,37]
        case `Raron`:
            return [234,109,125]
        case `La Baume`:
            return [103,100,162]
        case `Freie Ämter`:
            return [193,120,155]
        case `Mirabel`:
            return [245,127,110]
        case `Poitiers`:
            return [184,196,84]
        case `Queyras`: case `Escartons`:
            return [206,168,228]
        default:
            return [150,150,150]
    }
}
//main
export function checkCity(){
    print(`Checking Order`)
    types.map.forEach(map=>map.city.forEach((chunk,index)=>{
        if(index==0){
            chunk.forEach(inner=>{
                for(let a=1,la=inner.length;a<la;a++){
                    if(inner[a].loc[1]<inner[a-1].loc[1]||inner[a].loc[1]==inner[a-1].loc[1]&&inner[a].loc[0]<inner[a-1].loc[0]){
                        print(map.name,index,inner[a-1].name,inner[a].name)
                    }
                }
            })
        }else{
            for(let a=1,la=chunk.length;a<la;a++){
                if(chunk[a].loc[1]<chunk[a-1].loc[1]||chunk[a].loc[1]==chunk[a-1].loc[1]&&chunk[a].loc[0]<chunk[a-1].loc[0]){
                    print(map.name,index,chunk[a-1].name,chunk[a].name)
                }
            }
        }
    }))
}
export function orderTeam(){
    let totals=[]
    types.map[0].team.forEach(team=>totals.push({name:team.name,strength:0}))
    types.map[0].city.forEach(set=>set.forEach(city=>totals[findName(city.rule,totals)].strength+=(city.type==1?0.5:1)))
    print(totals)
    totals.sort((a,b)=>a.strength-b.strength).forEach(total=>print(total.name))
}
export function see(){
    current.cities.forEach(city=>city.fade.map=1)
}