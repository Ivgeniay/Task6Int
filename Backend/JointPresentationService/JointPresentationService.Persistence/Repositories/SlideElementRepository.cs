using JointPresentationService.Domain.Interfaces;
using JointPresentationService.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace JointPresentationService.Persistence.Repositories
{
    public class SlideElementRepository : ISlideElementRepository
    {
        private readonly ApplicationDbContext _context;

        public SlideElementRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<SlideElement?> GetByIdAsync(int id) =>
            await _context.SlideElements.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id);
        

        public async Task<SlideElement> CreateAsync(SlideElement element)
        {
            _context.SlideElements.Add(element);
            await _context.SaveChangesAsync();
            return element;
        }

        public async Task<SlideElement> UpdateAsync(SlideElement element)
        {
            _context.SlideElements.Update(element);
            await _context.SaveChangesAsync();
            return element;
        }

        public async Task DeleteAsync(int id)
        {
            var element = await _context.SlideElements.FindAsync(id);
            if (element != null)
            {
                _context.SlideElements.Remove(element);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<SlideElement>> GetBySlideIdAsync(int slideId) =>
            await _context.SlideElements
                .AsNoTracking()
                .Where(e => e.SlideId == slideId)
                .ToListAsync();
        

        public async Task<List<SlideElement>> GetByCreatedByIdAsync(int userId) =>
            await _context.SlideElements
                .AsNoTracking()
                .Where(e => e.CreatedById == userId)
                .ToListAsync();
        

        public async Task DeleteBySlideIdAsync(int slideId)
        {
            var elements = await _context.SlideElements
                .Where(e => e.SlideId == slideId)
                .ToListAsync();

            _context.SlideElements.RemoveRange(elements);
            await _context.SaveChangesAsync();
        }
    }

}
