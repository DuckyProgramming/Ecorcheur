import {types} from './variables.mjs'
import {constrain,random,floor,min,max,round} from './functions.mjs'
export class calc{
    constructor(operation){
        this.operation=operation
        this.variant=0
        this.terrain={list:[],select:0}
        this.sides=[{stack:false,strategy:0,smart:0,salient:0,force:[]},{stack:false,strategy:0,smart:0,salient:0,force:[]}]
        this.result={}
        this.terrainSet=[
            {name:'No Terrain',defend:[1,1.2],safe:1,attrition:[1,1]},
            {name:'River',defend:[1.35,1.35],safe:0.9,attrition:[1.25,1.25]},
            {name:'Wall',defend:[3,3],safe:0.5,attrition:[0.75,0.5]},
            {name:'Village',defend:[1.25,1.25],safe:0.9,attrition:[0.75,0.5]},
        ]
        this.distSet=[
            {name:'Close',ab:'C',mult:1},
            {name:'Mid',ab:'M',mult:0.95},
            {name:'Distant',ab:'D',mult:0.875},
            {name:'Disconnected',ab:'DC',mult:0.775},
            {name:'Poor',ab:'P',mult:0.65},
            {name:'Awful',ab:'A',mult:0.525},
            {name:'Miserable',ab:'MI',mult:0.4},
            {name:'Dejected',ab:'DE',mult:0.3},
            {name:'Crushed',ab:'CR',mult:0.225},
            {name:'Incapable',ab:'I',mult:0.175},
            {name:'Shattered',ab:'SH',mult:0.135},
            {name:'Vanished',ab:'V',mult:0.105},
            {name:'Horrific',ab:'H',mult:0.085},
        ]
    }
    reset(){
        this.sides=[{stack:false,strategy:0,smart:0,salient:0,force:[]},{stack:false,strategy:0,smart:0,salient:0,force:[]}]
        this.result={}
        this.terrain.list=[]
    }
    calc(){
        this.sides.forEach(side=>{if(side.force.length==0){throw new Error('Fight 0')}})
        this.sides.forEach(side=>side.force.forEach(force=>force.dist=constrain(force.dist,0,this.distSet.length-1)))
        this.result.winner=[]
        this.result.casualties=[]
        this.result.command=[random(1,1.2),random(1,1.2)]
        for(let a=0,la=this.sides.length;a<la;a++){
            this.result.casualties.push([])
        }
        for(let a=0,la=[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,3][floor(random(0,36))];a<la;a++){
            let result=this.battle(a)
            this.result.winner.push(result.winner+1)
            for(let b=0,lb=result.casualties.length;b<lb;b++){
                for(let c=0,lc=result.casualties[b].length;c<lc;c++){
                    if(a==0){
                        let fixed=result.casualties[b][c]
                        fixed.team=this.sides[b].force[c].team
                        this.result.casualties[b].push(fixed)
                    }else{
                        this.result.casualties[b][c].number+=result.casualties[b][c].number
                        this.result.casualties[b][c].morale+=result.casualties[b][c].morale
                    }
                    this.result.casualties[b][c].base=this.sides[b].force[c].number
                    this.result.casualties[b][c].team=this.sides[b].force[c].team
                    this.result.casualties[b][c].type=this.sides[b].force[c].type
                    this.sides[b].force[c].number-=result.casualties[b][c].number
                }
            }
            for(let b=0,lb=this.sides.length;b<lb;b++){
                let total=0
                for(let c=0,lc=this.sides[b].force.length;c<lc;c++){
                    total+=this.sides[b].force[c].number
                }
                if(total<=0){
                    a=la
                }
            }
        }
        return this.result
    }
    battle(tick){
        if(this.terrain.list.length==0){
            this.terrain.list.push(0)
        }
        let terrainActive={defend:1,safe:1,attrition:[2.5,2.5]}
        for(let a=0,la=this.terrain.list.length;a<la;a++){
            terrainActive.defend*=this.terrainSet[this.terrain.list[a]].defend[la==1?1:0]
            terrainActive.safe*=this.terrainSet[this.terrain.list[a]].safe
            terrainActive.attrition[0]*=this.terrainSet[this.terrain.list[a]].attrition[0]
            terrainActive.attrition[1]*=this.terrainSet[this.terrain.list[a]].attrition[1]
        }
        let result={}
        let strength=[]
        let attacking=[[0,0],[0,0]]
        for(let a=0,la=this.sides.length;a<la;a++){
            let total=0
            for(let b=0,lb=this.sides[a].force.length;b<lb;b++){
                total+=this.sides[a].force[b].number
            }
            let calc=0
            let count=0
            for(let b=0,lb=this.sides[a].force.length;b<lb;b++){
                let value=this.sides[a].force[b].number*types.team[this.sides[a].force[b].team].quality*this.distSet[this.sides[a].force[b].dist].mult
                if(this.sides[a].strategy==1){
                    value*=this.variant==1?1.25:terrainActive.defend
                }
                attacking[a][1]+=value
                if(this.sides[a].strategy==0){
                    attacking[a][0]+=value
                }
                calc+=value
                if(this.sides[a].force[b].number>0){
                    let same=false
                    for(let c=0,lc=b;c<lc;c++){
                        if(this.sides[a].force[b].team==this.sides[a].force[c].team){
                            same=true
                        }
                    }
                    if(!same){
                        count++
                    }
                }
            }
            calc*=this.result.command[a]
            calc*=[1,1.125,0.875][this.sides[a].smart]
            if(this.sides[a].force.length>1){
                calc*=(0.975-count*0.01)**(this.sides[a].force.length-1)
            }
            if(this.sides[a].salient>0){
                calc*=0.85**this.sides[a].salient
            }
            strength.push(calc)
        }
        if(strength[0]==0){
            this.sides[0].strategy=2
        }
        if(strength[1]==0){
            this.sides[1].strategy=2
        }
        if(this.sides[0].strategy==2&&this.sides[1].strategy==2){
            result.winner=2
            result.casualties=[]
            let loserCapture=0
            let winnerCapture=0
            for(let a=0,la=this.sides.length;a<la;a++){
                result.casualties.push([])
                let mult=random(1,2)
                for(let b=0,lb=this.sides[a].force.length;b<lb;b++){
                    let num=this.sides[a].force[b].number*random(0.01,0.02)*terrainActive.attrition[1]*(1+this.sides[a].salient*0.15)*mult/this.distSet[this.sides[a].force[b].dist].mult
                    result.casualties[a].push({number:num,morale:random(2,6)})
                    if(a==0){
                        winnerCapture+=num*types.team[this.sides[a].force[b].team].morale
                    }else{
                        loserCapture+=num*types.team[this.sides[a].force[b].team].morale
                    }
                }
            }
            if(this.variant==1){
                for(let a=0,la=2;a<la;a++){
                    let left=floor(random(0,a==0?loserCapture*0.75:winnerCapture*0.25))
                    while(left>0){
                        let move=ceil(left*random(0.1,0.2))
                        left-=move
                        let totalStrength=0
                        for(let b=0,lb=this.sides[a].force.length;b<lb;b++){
                            totalStrength+=this.sides[a].force[b].number*types.team[this.sides[a].force[b].team].quality
                        }
                        if(totalStrength!=0){
                            let taker=0
                            if(this.sides[a].force.length==1){
                                taker=0
                            }else{
                                let tick=random(0,totalStrength)
                                for(let b=0,lb=this.sides[a].force.length;b<lb;b++){
                                    if(tick>=this.sides[a].force[b].number*types.team[this.sides[a].force[b].team].quality){
                                        tick-=this.sides[a].force[b].number*types.team[this.sides[a].force[b].team].quality
                                        taker++
                                    }else{
                                        break
                                    }
                                }
                            }
                            result.casualties[a][taker].number-=move
                        }
                    }
                }
            }
        }else if(this.sides[0].strategy==2){
            result.winner=1
            result.casualties=[]
            let loserCapture=0
            let winnerCapture=0
            let mult=random(1,2)
            for(let a=0,la=this.sides.length;a<la;a++){
                result.casualties.push([])
                for(let b=0,lb=this.sides[a].force.length;b<lb;b++){
                    let key=a==1?{
                        number:this.sides[a].force[b].number*random(0.01,0.02)*terrainActive.attrition[1]*(1+this.sides[a].salient*0.125)*mult/this.distSet[this.sides[a].force[b].dist].mult,
                        morale:0
                    }:{
                        number:this.sides[a].force[b].number*random(0.01,0.02)*(1.5+terrainActive.attrition[1])*(1+this.sides[a].salient*0.125)*mult/this.distSet[this.sides[a].force[b].dist].mult*(1+random(0.5,1)*attacking[1-a][0]/attacking[1-a][1]),
                        morale:(random(2,6)+max(100,strength[1]-strength[0])/10000*(this.variant==1?100:0)*random(1,3))*(strength[0]==0?max(2,4-tick):1)/(0.5+this.distSet[this.sides[a].force[b].dist].mult*0.5)
                    }
                    let num=key.number
                    result.casualties[a].push(key)
                    if(a==1){
                        winnerCapture+=num*types.team[this.sides[a].force[b].team].morale
                    }else{
                        loserCapture+=num*types.team[this.sides[a].force[b].team].morale
                    }
                }
            }
            if(this.variant==1){
                for(let a=0,la=2;a<la;a++){
                    let left=floor(random(0,a==result.winner?loserCapture*0.75:winnerCapture))
                    while(left>0){
                        let move=ceil(left*random(0.1,0.2))
                        left-=move
                        let totalStrength=0
                        for(let b=0,lb=this.sides[a].force.length;b<lb;b++){
                            totalStrength+=this.sides[a].force[b].number*types.team[this.sides[a].force[b].team].quality
                        }
                        if(totalStrength!=0){
                            let taker=0
                            if(this.sides[a].force.length==1){
                                taker=0
                            }else{
                                let tick=random(0,totalStrength)
                                for(let b=0,lb=this.sides[a].force.length;b<lb;b++){
                                    if(tick>=this.sides[a].force[b].number*types.team[this.sides[a].force[b].team].quality){
                                        tick-=this.sides[a].force[b].number*types.team[this.sides[a].force[b].team].quality
                                        taker++
                                    }else{
                                        break
                                    }
                                }
                            }
                            result.casualties[a][taker].number-=move
                        }
                    }
                }
            }
        }else if(this.sides[1].strategy==2){
            result.winner=0
            result.casualties=[]
            let loserCapture=0
            let winnerCapture=0
            let mult=random(1,2)
            for(let a=0,la=this.sides.length;a<la;a++){
                result.casualties.push([])
                for(let b=0,lb=this.sides[a].force.length;b<lb;b++){
                    let key=a==0?{
                        number:this.sides[a].force[b].number*random(0.01,0.02)*terrainActive.attrition[1]*(1+this.sides[a].salient*0.125)*mult/this.distSet[this.sides[a].force[b].dist].mult,
                        morale:0
                    }:{
                        number:this.sides[a].force[b].number*random(0.01,0.02)*(1.5+terrainActive.attrition[1])*(1+this.sides[a].salient*0.125)*mult/this.distSet[this.sides[a].force[b].dist].mult*(1+random(0.5,1)*attacking[1-a][0]/attacking[1-a][1]),
                        morale:(random(2,6)+max(100,strength[0]-strength[1])/10000*(this.variant==1?100:0)*random(1,3))*(strength[1]==0?max(2,4-tick):1)/(0.5+this.distSet[this.sides[a].force[b].dist].mult*0.5)
                    }
                    let num=key.number
                    result.casualties[a].push(key)
                    if(a==0){
                        winnerCapture+=num*types.team[this.sides[a].force[b].team].morale
                    }else{
                        loserCapture+=num*types.team[this.sides[a].force[b].team].morale
                    }
                }
            }
            if(this.variant==1){
                for(let a=0,la=2;a<la;a++){
                    let left=floor(random(0,a==result.winner?loserCapture*0.75:winnerCapture*0.25))
                    while(left>0){
                        let move=ceil(left*random(0.1,0.2))
                        left-=move
                        let totalStrength=0
                        for(let b=0,lb=this.sides[a].force.length;b<lb;b++){
                            totalStrength+=this.sides[a].force[b].number*types.team[this.sides[a].force[b].team].quality
                        }
                        if(totalStrength!=0){
                            let taker=0
                            if(this.sides[a].force.length==1){
                                taker=0
                            }else{
                                let tick=random(0,totalStrength)
                                for(let b=0,lb=this.sides[a].force.length;b<lb;b++){
                                    if(tick>=this.sides[a].force[b].number*types.team[this.sides[a].force[b].team].quality){
                                        tick-=this.sides[a].force[b].number*types.team[this.sides[a].force[b].team].quality
                                        taker++
                                    }else{
                                        break
                                    }
                                }
                            }
                            result.casualties[a][taker].number-=move
                        }
                    }
                }
            }
        }else{
            let chances=[0,0]
            /*if(strength[1]==0){
                print('100% 0%')
            }else if(strength[0]==0){
                print('0% 100%')
            }else{
                print(`${round((strength[0]/(strength[0]+strength[1])*(1-chances[0]-chances[1])+chances[0])*100)}% ${round((strength[1]/(strength[0]+strength[1])*(1-chances[0]-chances[1])+chances[1])*100)}%`)
            }*/
            let totalStrength=0
            for(let a=0,la=strength.length;a<la;a++){
                totalStrength+=strength[a]
            }
            if(totalStrength==0){
                result.winner=floor(random(0,2))
            }else{
                let tick=random(0,totalStrength)
                result.winner=0
                for(let a=0,la=strength.length;a<la;a++){
                    if(tick>=strength[a]){
                        tick-=strength[a]
                        result.winner++
                    }else{
                        break
                    }
                }
            }
            result.casualties=[]
            for(let a=0,la=this.sides.length;a<la;a++){
                result.casualties.push([])
            }
            let loserCasualties=0
            let loserCapture=0
            let mult=random(1,2.5)
            for(let a=0,la=this.sides[1-result.winner].force.length;a<la;a++){
                let num=this.sides[1-result.winner].force[a].number==0?0:this.sides[1-result.winner].force[a].number*min((random(0.05,0.15)+strength[result.winner]*0.025/strength[1-result.winner]*max(3-terrainActive.defend-(strength[1-result.winner])/10000*(this.variant==1?1000:1),1))*mult*(this.sides[0].strategy==1&&this.sides[1].strategy==1?0.5:1)*(this.sides[result.winner].strategy==0?(1+random(0.2,0.4)*attacking[result.winner][0]/attacking[result.winner][1]):1)/types.team[this.sides[1-result.winner].force[a].team].quality*(this.sides[1-result.winner].strategy==1?terrainActive.safe*0.25+0.75:1)+random(0.01,0.02)*terrainActive.attrition[constrain(this.sides[1-result.winner].strategy,0,2)]*(1+this.sides[1-result.winner].salient*0.125)/(0.5+this.distSet[this.sides[1-result.winner].force[a].dist].mult*0.5)*[1,0.96,1.04][this.sides[1-result.winner].smart],1)
                result.casualties[1-result.winner].push({number:num,morale:-(random(-20-(num/this.sides[1-result.winner].force[a].number)*20,-10-(num/this.sides[1-result.winner].force[a].number)*15))*(this.sides[0].strategy==1&&this.sides[1].strategy==1?0.5:1)*(this.sides[result.winner].strategy==0?(1+random(0.2,0.4)*attacking[result.winner][0]/attacking[result.winner][1]):1)/this.distSet[this.sides[1-result.winner].force[a].dist].mult})
                loserCasualties+=num
                loserCapture+=num*types.team[this.sides[1-result.winner].force[a].team].morale
            }
            let winnerContrib=0
            for(let a=0,la=this.sides[result.winner].force.length;a<la;a++){
                winnerContrib+=this.sides[result.winner].force[a].number
            }
            let winnerCasualties=0
            let winnerCapture=0
            for(let a=0,la=this.sides[result.winner].force.length;a<la;a++){
                let num=min(
                    this.sides[result.winner].force[a].number*(loserCasualties/winnerContrib*[random(0.2,0.8),random(0.8,1.6)][floor(random(0,2))]/types.team[this.sides[result.winner].force[a].team].quality+random(0.01,0.02)*terrainActive.attrition[constrain(this.sides[result.winner].strategy,0,2)]*(1+this.sides[result.winner].salient*0.125)/this.distSet[this.sides[result.winner].force[a].dist].mult),
                    this.sides[result.winner].force[a].number*(min((random(0.03,0.09)+strength[1-result.winner]*0.015/strength[result.winner])*mult*(this.sides[0].strategy==1&&this.sides[1].strategy==1?0.4:1)/types.team[this.sides[result.winner].force[a].team].quality*(this.sides[result.winner].strategy==1?terrainActive.safe:1)*(1+this.sides[result.winner].salient*0.05),random(0.8,0.9))+random(0.01,0.02))
                )*[1,0.96,1.04][this.sides[result.winner].smart]
                result.casualties[result.winner].push({number:num,morale:-(random(-5-(num/this.sides[result.winner].force[a].number)*20/3,-(num/this.sides[result.winner].force[a].number)*5))*(this.sides[0].strategy==1&&this.sides[1].strategy==1?0.4:1)*(this.sides[result.winner].strategy==1?terrainActive.safe:1)*(1+this.sides[result.winner].salient*0.05)/(0.5+this.distSet[this.sides[result.winner].force[a].dist].mult*0.5)})
                winnerCasualties+=num
                winnerCapture+=num*types.team[this.sides[result.winner].force[a].team].morale
            }
            if(this.variant==1){
                for(let a=0,la=2;a<la;a++){
                    let left=floor(random(0,a==result.winner?loserCapture*0.75:winnerCapture*0.25))
                    while(left>0){
                        let move=ceil(left*random(0.1,0.2))
                        left-=move
                        let totalStrength=0
                        for(let b=0,lb=this.sides[a].force.length;b<lb;b++){
                            totalStrength+=this.sides[a].force[b].number*types.team[this.sides[a].force[b].team].quality
                        }
                        if(totalStrength!=0){
                            let taker=0
                            if(this.sides[a].force.length==1){
                                taker=0
                            }else{
                                let tick=random(0,totalStrength)
                                for(let b=0,lb=this.sides[a].force.length;b<lb;b++){
                                    if(tick>=this.sides[a].force[b].number*types.team[this.sides[a].force[b].team].quality){
                                        tick-=this.sides[a].force[b].number*types.team[this.sides[a].force[b].team].quality
                                        taker++
                                    }else{
                                        break
                                    }
                                }
                            }
                            result.casualties[a][taker].number-=move
                        }
                    }
                }
            }
        }
        let totals=[]
        for(let a=0,la=this.sides.length;a<la;a++){
            totals.push(0)
            for(let b=0,lb=this.sides[a].force.length;b<lb;b++){
                totals[a]+=this.sides[a].force[b].number
            }
        }
        for(let a=0,la=this.sides.length;a<la;a++){
            for(let b=0,lb=this.sides[a].force.length;b<lb;b++){
                if(types.team[this.sides[a].force[b].team].name=='Crusaders'||types.team[this.sides[a].force[b].team].name=='Jihadists'){
                    result.casualties[a][b].number=round(min(result.casualties[a][b].number+this.sides[a].force[b].number*random(0.025,0.1),this.sides[a].force[b].number)+random(-0.5,0.5))
                }else{
                    result.casualties[a][b].number=round(result.casualties[a][b].number+random(-0.5,0.5))
                }
                if(totals[a]>0){
                    result.casualties[a][b].morale*=types.team[this.sides[a].force[b].team].morale*min(this.sides[a].force[b].number/totals[a]*lb*2,1)
                }
            }
        }
        return result
    }
}