using JointPresentationService.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JointPresentationService.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PresentationsController : ControllerBase
    {
        private readonly IPresentationService _presentationService;
        private readonly ISlideService _slideService;

        public PresentationsController(
            IPresentationService presentationService,
            ISlideService slideService)
        {
            _presentationService = presentationService;
            _slideService = slideService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllPresentations()
        {
            try
            {
                var presentations = await _presentationService.GetAllPresentationsAsync();
                return Ok(presentations);
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
