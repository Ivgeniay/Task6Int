using JointPresentationService.Domain.Interfaces;
using JointPresentationService.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace JointPresentationService.Persistence.Repositories
{
    public class PresentationRepository : IPresentationRepository
    {
        private readonly ApplicationDbContext _context;

        public PresentationRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Presentation?> GetByIdAsync(int id) =>
            await _context.Presentations
            .AsNoTracking().
            FirstOrDefaultAsync(p => p.Id == id);

        public async Task<Presentation?> GetByIdWithSlidesAsync(int id) =>
            await _context.Presentations
                .AsNoTracking()
                .Include(p => p.Slides.OrderBy(s => s.Order))
                .FirstOrDefaultAsync(p => p.Id == id);

        public async Task<Presentation> CreateAsync(Presentation presentation)
        {
            _context.Presentations.Add(presentation);
            await _context.SaveChangesAsync();
            return presentation;
        }

        public async Task<Presentation> UpdateAsync(Presentation presentation)
        {
            _context.Presentations.Update(presentation);
            await _context.SaveChangesAsync();
            return presentation;
        }

        public async Task DeleteAsync(int id)
        {
            var presentation = await _context.Presentations.FindAsync(id);
            if (presentation != null)
            {
                _context.Presentations.Remove(presentation);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<Presentation>> GetAllAsync() =>
            await _context.Presentations
            .Include(p => p.Creator)
            .AsNoTracking()
            .ToListAsync();
        

        public async Task<List<Presentation>> GetByCreatorIdAsync(int creatorId) =>
            await _context.Presentations
                .AsNoTracking()
                .Where(p => p.CreatorId == creatorId)
                .ToListAsync();
        

        public async Task<List<User>> GetEditorsAsync(int presentationId) =>
            await _context.UserEditorPresentations
                .AsNoTracking()
                .Where(uep => uep.PresentationId == presentationId)
                .Select(uep => uep.User)
                .ToListAsync();
        

        public async Task AddEditorAsync(int presentationId, int userId)
        {
            var editorRelation = new UserEditorPresentation
            {
                PresentationId = presentationId,
                UserId = userId,
                AddedAt = DateTime.UtcNow
            };
            _context.UserEditorPresentations.Add(editorRelation);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveEditorAsync(int presentationId, int userId)
        {
            var editorRelation = await _context.UserEditorPresentations
                .FirstOrDefaultAsync(uep => uep.PresentationId == presentationId && uep.UserId == userId);
            if (editorRelation != null)
            {
                _context.UserEditorPresentations.Remove(editorRelation);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> IsUserEditorAsync(int presentationId, int userId) =>
            await _context.UserEditorPresentations
                .AsNoTracking()
                .AnyAsync(uep => uep.PresentationId == presentationId && uep.UserId == userId);
        
    }

}
