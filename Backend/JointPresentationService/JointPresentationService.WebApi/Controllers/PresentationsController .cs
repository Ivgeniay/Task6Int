using JointPresentationService.Application.Interfaces;
using JointPresentationService.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace JointPresentationService.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PresentationsController : ControllerBase
    {
        private readonly IPresentationService _presentationService;
        private readonly ISlideService _slideService;
        private readonly IUserService _userService;

        public PresentationsController(
            IPresentationService presentationService,
            ISlideService slideService,
            IUserService userService)
        {
            _presentationService = presentationService;
            _slideService = slideService;
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllPresentations()
        {
            try
            {
                var presentations = await _presentationService.GetAllPresentationsAsync();
                var creatorIds = presentations.Select(p => p.CreatorId).Distinct().ToList();
                var creators = await _userService.GetUsersByIdsAsync(creatorIds);
                var creatorsDict = creators.ToDictionary(u => u.Id, u => u);

                var result = presentations.Select(p => new
                {
                    p.Id,
                    p.Title,
                    p.CreatedAt,
                    p.UpdatedAt,
                    p.CreatorId,
                    Creator = creatorsDict.TryGetValue(p.CreatorId, out var creator)
                        ? new { creator.Id, creator.Nickname }
                        : null,
                    SlidesCount = p.Slides?.Count ?? 0
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPresentationById(int id)
        {
            try
            {
                var presentation = await _presentationService.GetByIdAsync(id);
                return Ok(presentation);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}/slides")]
        public async Task<IActionResult> GetPresentationSlides(int id)
        {
            try
            {
                var slides = await _slideService.GetByPresentationIdAsync(id);
                return Ok(slides);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}/editors")]
        public async Task<IActionResult> GetPresentationEditors(int id)
        {
            try
            {
                var editors = await _presentationService.GetPresentationEditorsAsync(id);
                return Ok(editors);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }

}
