using JointPresentationService.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JointPresentationService.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SlidesController : ControllerBase
    {
        private readonly ISlideService _slideService;

        public SlidesController(ISlideService slideService)
        {
            _slideService = slideService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSlideById(int id)
        {
            try
            {
                var slide = await _slideService.GetSlideWithElementsAsync(id);
                return Ok(slide);
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

        [HttpGet("{id}/elements")]
        public async Task<IActionResult> GetSlideElements(int id)
        {
            try
            {
                var elements = await _slideService.GetSlideElementsAsync(id);

                return Ok(elements);
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
