using JointPresentationService.Application.Interfaces;
using JointPresentationService.Application.Services;
using JointPresentationService.Domain.Interfaces;
using JointPresentationService.Infrastructure.SirnalR.Hubs;
using JointPresentationService.Persistence;
using JointPresentationService.Persistence.Repositories;
using JointPresentationService.WebApi.Extensions;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

namespace JointPresentationService.WebApi
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddControllers();
            builder.Services.AddOpenApi();
            builder.Services.AddSignalR();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("FrontReactApp", policy =>
                {
                    policy.WithOrigins(
                        "http://localhost:3000", 
                        "http://147.45.66.49:80",
                        "http://172.29.224.1:3000",
                        "http://192.168.56.1:3000"
                        )
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials()
                          ;
                });
            });

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<IPresentationRepository, PresentationRepository>();
            builder.Services.AddScoped<ISlideRepository, SlideRepository>();
            builder.Services.AddScoped<ISlideElementRepository, SlideElementRepository>();

            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IPresentationService, PresentationService>();
            builder.Services.AddScoped<ISlideService, SlideService>();

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
                app.MapScalarApiReference();
            }
            app.EnsureDB();

            app.UseCors("FrontReactApp");
            app.UseHttpsRedirection();

            app.UseAuthorization();

            app.MapControllers();
            app.MapHub<PresentationHub>("/presentationHub");

            app.Run();
        }
    }
}
