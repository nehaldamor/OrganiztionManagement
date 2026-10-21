import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { CreateTeamDto } from "../dto/create-team.dto";
import { UpdateTeamDto } from "../dto/update-team.dto";

@Injectable()
export class TeamRepository{
    constructor(private readonly prisma:PrismaService){}

    async findTeam(name:string,orgId:string){
        return await this.prisma.team.findUnique(
            {
                where:{
                    organizationId_name: {
                        name,
                        organizationId: orgId
                    }
                }
            }
        )
    }

    async createTeam(data:CreateTeamDto){
        return await this.prisma.team.create({
            data
        })
    }

    async listTeams(organizationId:string){ return this.prisma.team.findMany({ where:{organizationId}, include:{_count:{select:{members:true}}}, orderBy:{createdAt:'desc'} }); }
    async findById(id:string, organizationId:string){ return this.prisma.team.findFirst({ where:{id, organizationId}, include:{_count:{select:{members:true}}} }); }
    async update(id:string, data:UpdateTeamDto){ return this.prisma.team.update({ where:{id}, data }); }
    async updateStatus(id:string, status:'ACTIVE'|'INACTIVE'){ return this.prisma.team.update({ where:{id}, data:{status} }); }
    async delete(id:string){ return this.prisma.team.delete({ where:{id} }); }
    async listMembers(teamId:string){ return this.prisma.teamMember.findMany({ where:{teamId}, include:{user:{select:{id:true,name:true,email:true,role:true,status:true,organizationId:true}}}, orderBy:{joinedAt:'asc'} }); }
    async findMember(teamId:string,userId:string){ return this.prisma.teamMember.findUnique({where:{teamId_userId:{teamId,userId}}}); }
    async findUserTeam(userId:string){ return this.prisma.teamMember.findFirst({where:{userId}, include:{team:{select:{id:true,name:true,organizationId:true}}} }); }
    async createMember(teamId:string,userId:string,organizationId:string){ return this.prisma.teamMember.create({data:{teamId,userId,organizationId}}); }
    async deleteMember(teamId:string,userId:string){ return this.prisma.teamMember.delete({where:{teamId_userId:{teamId,userId}}}); }
    async findUser(userId:string,organizationId:string){ return this.prisma.user.findFirst({where:{id:userId,organizationId},select:{id:true}}); }
}
