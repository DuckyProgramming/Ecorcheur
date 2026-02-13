export class transitionManager{
    constructor(operation){
        this.operation=operation
        this.trigger=false
        this.anim=0
        this.scene=''
    }
    save(){
        let composite={
            trigger:this.trigger,
            anim:this.anim,
            scene:this.scene,
        }
        return composite
    }
    load(composite){
        this.trigger=composite.trigger
        this.anim=composite.anim
        this.scene=composite.scene
    }
    begin(scene){
        this.scene=scene
        this.trigger=true
    }
    display(layer){
        layer.noStroke()
        layer.fill(0)
        layer.rect(this.anim*layer.width/4,layer.height/2,this.anim*layer.width/2,layer.height)
        layer.rect(layer.width-this.anim*layer.width/4,layer.height/2,this.anim*layer.width/2,layer.height)
        layer.rect(layer.width/2,this.anim*layer.height/4,layer.width,this.anim*layer.height/2)
        layer.rect(layer.width/2,layer.height-this.anim*layer.height/4,layer.width,this.anim*layer.height/2)
    }
    update(){
        if(this.trigger){
            this.anim=round(this.anim*5+1)/5
            if(this.anim>=1){
                this.trigger=false
                this.operation.transitionComplete(this.scene)
                this.operation.scene=this.scene
            }
        }
        else if(this.anim>0){
            this.anim=round(this.anim*5-1)/5
        }
    }
}