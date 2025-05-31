using JointPresentationService.Persistence;

namespace JointPresentationService.WebApi.Extensions
{
    public static class WebApplicationExtensions
    {

        public static void EnsureDB(this WebApplication source)
        {
            using (var scope = source.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                try
                {
                    Console.WriteLine("Ensuring database is created and up to date...");
                    dbContext.Database.EnsureCreated();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Database error: {ex.Message}");
                    throw;
                }
            }
        }

        public static async Task FillTestUserData(this WebApplication source, uint quantityUsers = 8)
        {

            //using (var scope = source.Services.CreateScope())
            //{
            //    var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
            //}
        }
    }
}
