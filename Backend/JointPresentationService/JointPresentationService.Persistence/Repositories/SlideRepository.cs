using JointPresentationService.Domain.Interfaces;
using JointPresentationService.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace JointPresentationService.Persistence.Repositories
{
    public class SlideRepository : ISlideRepository
    {
        private readonly ApplicationDbContext _context;

        public SlideRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Slide?> GetByIdAsync(int id) =>
            await _context.Slides.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
        

        public async Task<Slide?> GetByIdWithElementsAsync(int id) =>
            await _context.Slides
                .AsNoTracking()
                .Include(s => s.Elements)
                .FirstOrDefaultAsync(s => s.Id == id);
        

        public async Task<Slide> CreateAsync(Slide slide)
        {
            _context.Slides.Add(slide);
            await _context.SaveChangesAsync();
            return slide;
        }

        public async Task<Slide> UpdateAsync(Slide slide)
        {
            _context.Slides.Update(slide);
            await _context.SaveChangesAsync();
            return slide;
        }

        public async Task DeleteAsync(int id)
        {
            var slide = await _context.Slides.FindAsync(id);
            if (slide != null)
            {
                _context.Slides.Remove(slide);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<Slide>> GetByPresentationIdAsync(int presentationId) =>
            await _context.Slides
                .AsNoTracking()
                .Where(s => s.PresentationId == presentationId)
                .OrderBy(s => s.Order)
                .ToListAsync();
        

        public async Task<int> GetMaxOrderAsync(int presentationId)
        {
            var maxOrder = await _context.Slides
                .AsNoTracking()
                .Where(s => s.PresentationId == presentationId)
                .MaxAsync(s => (int?)s.Order);
            return maxOrder ?? 0;
        }

        public async Task ReorderSlidesAsync(int presentationId, List<int> slideIds)
        {
            for (int i = 0; i < slideIds.Count; i++)
            {
                var slide = await _context.Slides.FindAsync(slideIds[i]);
                if (slide != null && slide.PresentationId == presentationId)
                {
                    slide.Order = i + 1;
                    slide.UpdatedAt = DateTime.UtcNow;
                }
            }
            await _context.SaveChangesAsync();
        }
    }

}
