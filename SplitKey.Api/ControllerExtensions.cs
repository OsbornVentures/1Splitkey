namespace SplitKey.Api;

using Microsoft.AspNetCore.Mvc;

public static class ControllerExtensions
{
    public static ActionResult SeeOther(this ControllerBase controller, string routeUrl, object routeValue, object output)
    {
        string fullPath = controller.Request.Scheme + "://" + controller.Request.Host + controller.Url.RouteUrl(routeUrl, routeValue);
        controller.Response.Headers.Add("Location", fullPath);
        return controller.StatusCode(303, output);
    }
}